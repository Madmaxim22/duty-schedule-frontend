import { useMemo } from 'react';
import { CalculatorForm } from '@/features/payroll/components/CalculatorForm';
import { PayrollBreakdown } from '@/features/payroll/components/PayrollBreakdown';
import { calculatePayroll } from '@/features/payroll/engine/calculatePayroll';
import '@/features/payroll/payroll.css';
import { usePersistedPayrollInput } from '@/features/payroll/utils/persistInput';
import { SubpageLayout } from '@/shared/ui/SubpageLayout';

export function PayrollCalculatorPage() {
  const [input, setInput] = usePersistedPayrollInput();

  const result = useMemo(() => {
    try {
      return calculatePayroll(input);
    } catch {
      return null;
    }
  }, [input]);

  return (
    <SubpageLayout className="payroll-page" title="Калькулятор довольствия">
      <p className="payroll-page__subtitle">
        Войска национальной гвардии РФ · контракт · приказ Росгвардии №472 (ред. 15.10.2025)
      </p>

      <div className="payroll-page__main">
        <aside className="payroll-panel payroll-panel--form">
          <CalculatorForm input={input} onChange={setInput} />
        </aside>

        <div className="payroll-panel payroll-panel--result">
          {result ? (
            <PayrollBreakdown result={result} />
          ) : (
            <p className="payroll-page__error">
              Ошибка расчёта. Проверьте введённые данные.
            </p>
          )}
        </div>
      </div>
    </SubpageLayout>
  );
}
