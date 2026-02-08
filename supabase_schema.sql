
-- ১. কাস্টম এনাম টাইপ তৈরি (যদি না থাকে)
DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('CASH', 'MOBILE', 'LOAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
      'INCOME', 'EXPENSE', 'CAPITAL_IN', 'CAPITAL_OUT', 
      'LOAN_GIVEN', 'LOAN_TAKEN', 'LOAN_COLLECTED', 'LOAN_REPAID', 
      'MOBILE_BANKING_RECEIVED', 'MOBILE_BANKING_SENT', 'ADJUSTMENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ২. অ্যাকাউন্টস টেবিল
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  type account_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৩. ট্রানজ্যাকশন টেবিল
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  type transaction_type NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  category TEXT,
  note TEXT,
  related_loan_person TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৪. ইনডেক্স
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- ৫. ব্যালেন্স অটো-আপডেট করার জন্য শক্তিশালী ফাংশন (Double Entry Support)
CREATE OR REPLACE FUNCTION handle_transaction_balance()
RETURNS TRIGGER AS $$
DECLARE
  cash_acc_id UUID;
BEGIN
  -- ইউজারের প্রধান ক্যাশ অ্যাকাউন্ট খুঁজে বের করা
  SELECT id INTO cash_acc_id FROM accounts 
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND type = 'CASH' 
  ORDER BY created_at ASC LIMIT 1;

  -- ১. পুরাতন ট্রানজ্যাকশনের প্রভাব মুছে ফেলা (যদি ডিলিট বা আপডেট হয়)
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    -- সাধারণ লেনদেন রিভার্স
    IF OLD.type IN ('INCOME', 'CAPITAL_IN', 'LOAN_TAKEN', 'LOAN_COLLECTED') THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type IN ('EXPENSE', 'CAPITAL_OUT', 'LOAN_GIVEN', 'LOAN_REPAID') THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    
    -- মোবাইল ব্যাংকিং রিভার্স (ডাবল এন্ট্রি)
    ELSIF OLD.type = 'MOBILE_BANKING_RECEIVED' THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
      IF cash_acc_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance + OLD.amount WHERE id = cash_acc_id;
      END IF;
    ELSIF OLD.type = 'MOBILE_BANKING_SENT' THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      IF cash_acc_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = cash_acc_id;
      END IF;

    -- অ্যাডজাস্টমেন্ট রিভার্স
    ELSIF OLD.type = 'ADJUSTMENT' THEN
       IF OLD.note LIKE '%পার্থক্য: -%' THEN
         UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
       ELSE
         UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
       END IF;
    END IF;
  END IF;

  -- ২. নতুন ট্রানজ্যাকশনের প্রভাব যোগ করা (যদি ইনসার্ট বা আপডেট হয়)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- সাধারণ লেনদেন
    IF NEW.type IN ('INCOME', 'CAPITAL_IN', 'LOAN_TAKEN', 'LOAN_COLLECTED') THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type IN ('EXPENSE', 'CAPITAL_OUT', 'LOAN_GIVEN', 'LOAN_REPAID') THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    
    -- মোবাইল ব্যাংকিং (ডাবল এন্ট্রি লজিক)
    ELSIF NEW.type = 'MOBILE_BANKING_RECEIVED' THEN
      -- ডিজিটাল ব্যালেন্স বাড়বে
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
      -- ক্যাশ বক্স থেকে টাকা কমবে (কাস্টমারকে ক্যাশ দেওয়া হয়েছে)
      IF cash_acc_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance - NEW.amount WHERE id = cash_acc_id;
      END IF;
    ELSIF NEW.type = 'MOBILE_BANKING_SENT' THEN
      -- ডিজিটাল ব্যালেন্স কমবে
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      -- ক্যাশ বক্সে টাকা বাড়বে (কাস্টমার থেকে ক্যাশ পাওয়া গেছে)
      IF cash_acc_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = cash_acc_id;
      END IF;

    -- অ্যাডজাস্টমেন্ট
    ELSIF NEW.type = 'ADJUSTMENT' THEN
       IF NEW.note LIKE '%পার্থক্য: -%' THEN
         UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
       ELSE
         UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
       END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ৬. ট্রিগার সেটআপ
DROP TRIGGER IF EXISTS trg_manage_balance ON transactions;
CREATE TRIGGER trg_manage_balance
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION handle_transaction_balance();

-- ৭. Row Level Security (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own accounts" ON accounts;
CREATE POLICY "Users can manage their own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
