import type { PayrollLineItem, PayrollResult } from '../types/payroll';
import { formatRub } from '../utils/format';

interface Props {
  result: PayrollResult;
}

function LineRow({ item }: { item: PayrollLineItem }) {
  if (item.amount === 0 && item.id.startsWith('ous_detail_')) {
    return (
      <tr className="detail-row">
        <td>{item.label}</td>
        <td className="num">—</td>
        <td className="num">{item.percent}%</td>
        <td className="note">{item.note}</td>
      </tr>
    );
  }

  if (item.amount === 0 && item.id === 'risk_cap') {
    return (
      <tr className="warn-row">
        <td colSpan={4}>{item.note}</td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        {item.label}
        {item.note && <span className="line-note">{item.note}</span>}
      </td>
      <td className="num">{item.base > 0 ? formatRub(item.base) : '—'}</td>
      <td className="num">{item.percent != null ? `${item.percent}%` : '—'}</td>
      <td className="num amount">{formatRub(item.amount)}</td>
    </tr>
  );
}

export function PayrollBreakdown({ result }: Props) {
  return (
    <section className="breakdown">
      <h2>Расчёт денежного довольствия</h2>

      <div className="summary-cards">
        <div className="card">
          <span className="card-label">ОДС</span>
          <span className="card-value">{formatRub(result.ods)}</span>
        </div>
        <div className="card">
          <span className="card-label">Районный коэфф.</span>
          <span className="card-value">×{result.regionalCoeff.toFixed(2)}</span>
        </div>
        <div className="card">
          <span className="card-label">Начислено</span>
          <span className="card-value">{formatRub(result.totalMonthly)}</span>
        </div>
        <div className="card muted highlight-secondary">
          <span className="card-label">На руки</span>
          <span className="card-value">{formatRub(result.netMonthly)}</span>
          <span className="card-hint">
            в месяц · начислено {formatRub(result.totalMonthly)}, НДФЛ −
            {formatRub(result.ndfl)}
          </span>
        </div>
        <div className="card muted highlight-secondary">
          <span className="card-label">Матпомощь на руки</span>
          <span className="card-value">{formatRub(result.annualMaterialAidNet)}</span>
          <span className="card-hint">
            раз в год · начислено {formatRub(result.annualMaterialAid)}, НДФЛ −
            {formatRub(result.annualMaterialAidNdfl)} (п. 81)
          </span>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <ul className="warnings">
          {result.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <div className="table-scroll" tabIndex={0} aria-label="Таблица расчёта — прокрутка по горизонтали">
        <table className="payroll-table">
          <colgroup>
            <col />
            <col className="col-num" />
            <col className="col-num col-pct" />
            <col className="col-num" />
          </colgroup>
          <thead>
            <tr>
              <th>Статья</th>
              <th className="num">База</th>
              <th className="num">%</th>
              <th className="num">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {result.lines.map((line) => (
              <LineRow key={line.id} item={line} />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}><strong>Итого с премией (начислено)</strong></td>
              <td className="num amount"><strong>{formatRub(result.totalMonthly)}</strong></td>
            </tr>
            <tr className="deduction-row">
              <td colSpan={2}>
                <strong>НДФЛ</strong>
                <span className="line-note">налог на доходы физлиц, удерживается государством</span>
              </td>
              <td className="num">{result.ndflPercent}%</td>
              <td className="num amount deduction">−{formatRub(result.ndfl)}</td>
            </tr>
            <tr className="net-row">
              <td colSpan={3}><strong>К выплате «на руки»</strong></td>
              <td className="num amount"><strong>{formatRub(result.netMonthly)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <section className="annual-aid">
        <h3>Ежегодная материальная помощь (справочно)</h3>
        <div className="table-scroll" tabIndex={0} aria-label="Таблица матпомощи — прокрутка по горизонтали">
          <table className="payroll-table compact">
            <colgroup>
              <col />
              <col className="col-num" />
              <col className="col-num col-pct" />
              <col className="col-num" />
            </colgroup>
            <tbody>
              <tr>
                <td>
                  Материальная помощь
                  <span className="line-note">1× ОДС в год, п. 81</span>
                </td>
                <td className="num">{formatRub(result.ods)}</td>
                <td className="num">100%</td>
                <td className="num amount">{formatRub(result.annualMaterialAid)}</td>
              </tr>
              <tr className="deduction-row">
                <td colSpan={2}>
                  НДФЛ
                  <span className="line-note">удерживается при разовой выплате</span>
                </td>
                <td className="num">{result.ndflPercent}%</td>
                <td className="num amount deduction">−{formatRub(result.annualMaterialAidNdfl)}</td>
              </tr>
              <tr className="net-row">
                <td colSpan={3}><strong>К выплате «на руки»</strong></td>
                <td className="num amount"><strong>{formatRub(result.annualMaterialAidNet)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p className="disclaimer">
        Справочный расчёт по приказу Росгвардии №472 (ред. 15.10.2025). Окончательная сумма
        определяется приказом командира и финансовым органом в/ч. Оклады проиндексированы ×1,076
        с 01.10.2025 (ПП РФ №464).
      </p>
    </section>
  );
}
