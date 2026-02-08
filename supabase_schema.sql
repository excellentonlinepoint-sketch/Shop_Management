
-- ১. প্রয়োজনীয় টাইপ তৈরি
DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('CASH', 'MOBILE', 'LOAN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
      'INCOME', 'EXPENSE', 'CAPITAL_IN', 'CAPITAL_OUT', 
      'LOAN_GIVEN', 'LOAN_TAKEN', 'LOAN_COLLECTED', 'LOAN_REPAID', 
      'MOBILE_BANKING_RECEIVED', 'MOBILE_BANKING_SENT', 'ADJUSTMENT'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ২. ব্যালেন্স ম্যানেজমেন্ট ফাংশন (Double Entry logic)
CREATE OR REPLACE FUNCTION handle_transaction_balance()
RETURNS TRIGGER AS $$
DECLARE
  cash_acc_id UUID;
BEGIN
  -- ইউজারের প্রধান 'CASH' অ্যাকাউন্ট খুঁজে বের করা
  SELECT id INTO cash_acc_id FROM accounts 
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND type = 'CASH' 
  ORDER BY created_at ASC LIMIT 1;

  -- পুরাতন ডাটা রিভার্স করা (Update বা Delete এর ক্ষেত্রে)
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    -- সাধারণ হিসাব রিভার্স
    IF OLD.type IN ('INCOME', 'CAPITAL_IN', 'LOAN_TAKEN', 'LOAN_COLLECTED') THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type IN ('EXPENSE', 'CAPITAL_OUT', 'LOAN_GIVEN', 'LOAN_REPAID') THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    
    -- মোবাইল ব্যাংকিং ডাবল এন্ট্রি রিভার্স
    ELSIF OLD.type = 'MOBILE_BANKING_RECEIVED' THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
      IF cash_acc_id IS NOT NULL THEN UPDATE accounts SET balance = balance + OLD.amount WHERE id = cash_acc_id; END IF;
    ELSIF OLD.type = 'MOBILE_BANKING_SENT' THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      IF cash_acc_id IS NOT NULL THEN UPDATE accounts SET balance = balance - OLD.amount WHERE id = cash_acc_id; END IF;

    ELSIF OLD.type = 'ADJUSTMENT' THEN
       IF OLD.note LIKE '%পার্থক্য: -%' THEN UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
       ELSE UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id; END IF;
    END IF;
  END IF;

  -- নতুন ডাটা অ্যাপ্লাই করা (Insert বা Update এর ক্ষেত্রে)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- সাধারণ হিসাব
    IF NEW.type IN ('INCOME', 'CAPITAL_IN', 'LOAN_TAKEN', 'LOAN_COLLECTED') THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type IN ('EXPENSE', 'CAPITAL_OUT', 'LOAN_GIVEN', 'LOAN_REPAID') THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    
    -- মোবাইল ব্যাংকিং ডাবল এন্ট্রি (আপনার চাহিদা অনুযায়ী)
    ELSIF NEW.type = 'MOBILE_BANKING_RECEIVED' THEN
      -- ১. ডিজিটাল হিসাব বাড়বে (Shopkeeper receives digital money)
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
      -- ২. ক্যাশ বাক্স কমবে (Shopkeeper gives physical cash to customer)
      IF cash_acc_id IS NOT NULL THEN UPDATE accounts SET balance = balance - NEW.amount WHERE id = cash_acc_id; END IF;
      
    ELSIF NEW.type = 'MOBILE_BANKING_SENT' THEN
      -- ১. ডিজিটাল হিসাব কমবে (Shopkeeper sends digital money)
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      -- ২. ক্যাশ বাক্স বাড়বে (Shopkeeper receives physical cash from customer)
      IF cash_acc_id IS NOT NULL THEN UPDATE accounts SET balance = balance + NEW.amount WHERE id = cash_acc_id; END IF;

    ELSIF NEW.type = 'ADJUSTMENT' THEN
       IF NEW.note LIKE '%পার্থক্য: -%' THEN UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
       ELSE UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id; END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ট্রিগার পুনরায় তৈরি
DROP TRIGGER IF EXISTS trg_manage_balance ON transactions;
CREATE TRIGGER trg_manage_balance
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION handle_transaction_balance();
