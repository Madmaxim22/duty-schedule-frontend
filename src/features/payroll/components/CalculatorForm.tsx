import type { ReactNode } from 'react';
import {
  ACHIEVEMENT_OPTIONS,
  CIPHER_STAZH_OPTIONS,
  CLASS_QUAL_OPTIONS,
  LEGAL_ALLOWANCE_OPTIONS,
  OUS_OPTIONS,
  STATE_SECRET_OPTIONS,
  ZGT_STAZH_OPTIONS,
} from '../data/allowances';
import { REGIONAL_ZONES } from '../data/regionalCoeffs';
import { RANKS, SENIORITY_RATES } from '../data/ranks';
import { TARIFF_GRADES } from '../data/tariffGrades';
import type { PayrollInput } from '../types/payroll';
import {
  rankSelectHint,
  rankSelectOption,
  regionalSelectHint,
  regionalSelectOption,
  stateSecretSelectHint,
  stateSecretSelectOption,
} from '../utils/selectLabels';

interface Props {
  input: PayrollInput;
  onChange: (next: PayrollInput) => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="form-section" open>
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

function FieldControl({ children }: { children: ReactNode }) {
  return <div className="field-control">{children}</div>;
}

function toggleArray(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export function CalculatorForm({ input, onChange }: Props) {
  const set = <K extends keyof PayrollInput>(key: K, value: PayrollInput[K]) =>
    onChange({ ...input, [key]: value });

  const setRisk = <K extends keyof PayrollInput['risk']>(
    key: K,
    value: PayrollInput['risk'][K],
  ) => onChange({ ...input, risk: { ...input.risk, [key]: value } });

  const grade = TARIFF_GRADES.find((g) => g.grade === input.tariffGrade);
  const rank = RANKS.find((r) => r.id === input.rankId);
  const regionalZone = REGIONAL_ZONES.find((z) => z.id === input.regionalZoneId);
  const stateSecret = STATE_SECRET_OPTIONS.find((s) => s.id === input.stateSecretId);
  const rankHint = rankSelectHint(rank);
  const regionalHint = regionalSelectHint(regionalZone);
  const stateSecretHint = stateSecretSelectHint(stateSecret);

  return (
    <form className="calculator-form" onSubmit={(e) => e.preventDefault()}>
      <Section title="Оклады (главы II–III)">
        <label>
          Воинское звание
          <FieldControl>
            <select value={input.rankId} onChange={(e) => set('rankId', e.target.value)}>
              {RANKS.map((r) => (
                <option key={r.id} value={r.id}>
                  {rankSelectOption(r)}
                </option>
              ))}
            </select>
          </FieldControl>
        </label>
        {rankHint && <p className="hint">{rankHint}</p>}

        <label>
          Тарифный разряд (должность)
          <FieldControl>
            <select
              value={input.tariffGrade}
              onChange={(e) => set('tariffGrade', Number(e.target.value))}
            >
              {TARIFF_GRADES.map((g) => (
                <option key={g.grade} value={g.grade}>
                  {g.grade} разр. — {g.salary.toLocaleString('ru-RU')} ₽
                </option>
              ))}
            </select>
          </FieldControl>
        </label>
        {grade && <p className="hint">{grade.examples}</p>}

        <label>
          Сохранённый оклад по должности (п. 25), ₽
          <input
            type="number"
            min={0}
            placeholder="Не применяется"
            value={input.savedPositionSalary ?? ''}
            onChange={(e) =>
              set('savedPositionSalary', e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </label>

        <label>
          Временно исполняемая должность (тарифный разряд)
          <FieldControl>
            <select
              value={input.actingTariffGrade ?? ''}
              onChange={(e) =>
                set('actingTariffGrade', e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">— не исполняет —</option>
              {TARIFF_GRADES.map((g) => (
                <option key={g.grade} value={g.grade}>
                  {g.grade} разр. — {g.salary.toLocaleString('ru-RU')} ₽
                </option>
              ))}
            </select>
          </FieldControl>
        </label>

        <label>
          Выслуга лет (надбавка к ОДС, п. 44)
          <input
            type="number"
            min={0}
            max={50}
            value={input.seniorityYears}
            onChange={(e) => set('seniorityYears', Number(e.target.value))}
          />
          <span className="hint">
            {SENIORITY_RATES.find((t) => input.seniorityYears >= t.minYears)?.label ?? ''}
          </span>
        </label>
      </Section>

      <Section title="Районные коэффициенты (п. 89, ПП №58)">
        <label>
          Местность службы
          <FieldControl>
            <select
              value={input.regionalZoneId}
              onChange={(e) => set('regionalZoneId', e.target.value)}
            >
              {REGIONAL_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {regionalSelectOption(z)}
                </option>
              ))}
            </select>
          </FieldControl>
        </label>
        {regionalHint && <p className="hint">{regionalHint}</p>}

        {input.regionalZoneId === 'custom' && (
          <div className="custom-regional">
            <label>
              Районный коэффициент
              <input
                type="number"
                step={0.05}
                min={1}
                max={2}
                value={input.customRegional?.districtCoeff ?? 1}
                onChange={(e) =>
                  set('customRegional', {
                    ...input.customRegional,
                    districtCoeff: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              % надбавки за стаж в районе
              <input
                type="number"
                min={0}
                max={100}
                value={input.customRegional?.seniorityPercent ?? 0}
                onChange={(e) =>
                  set('customRegional', {
                    ...input.customRegional,
                    seniorityPercent: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Высокогорный коэфф.
              <input
                type="number"
                step={0.05}
                min={1}
                max={2}
                value={input.customRegional?.highlandCoeff ?? 1}
                onChange={(e) =>
                  set('customRegional', {
                    ...input.customRegional,
                    highlandCoeff: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Пустынный коэфф.
              <input
                type="number"
                step={0.05}
                min={1}
                max={2}
                value={input.customRegional?.desertCoeff ?? 1}
                onChange={(e) =>
                  set('customRegional', {
                    ...input.customRegional,
                    desertCoeff: Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
        )}
      </Section>

      <Section title="Ежемесячные надбавки (глава VI)">
        <label>
          Классная квалификация (п. 46)
          <FieldControl>
            <select value={input.classQualId} onChange={(e) => set('classQualId', e.target.value)}>
              {CLASS_QUAL_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </FieldControl>
        </label>

        <label>
          Гостайна (п. 50–51)
          <FieldControl>
            <select value={input.stateSecretId} onChange={(e) => set('stateSecretId', e.target.value)}>
              {STATE_SECRET_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{stateSecretSelectOption(s)}</option>
              ))}
            </select>
          </FieldControl>
        </label>
        {stateSecretHint && <p className="hint">{stateSecretHint}</p>}
        {input.stateSecretId === 'special_importance_65' && (
          <label>
            % (до 65)
            <input
              type="number"
              min={25}
              max={65}
              value={input.stateSecretCustomPercent ?? 65}
              onChange={(e) => set('stateSecretCustomPercent', Number(e.target.value))}
            />
          </label>
        )}

        <fieldset>
          <legend>Особые условия службы (п. 52–53, приложения № 2–10)</legend>
          <div className="checkbox-grid">
            {OUS_OPTIONS.map((o) => (
              <label key={o.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={input.selectedOusIds.includes(o.id)}
                  onChange={() =>
                    set('selectedOusIds', toggleArray(input.selectedOusIds, o.id))
                  }
                />
                <span>
                  {o.label} ({o.variable ? 'до ' : ''}{o.maxPercent ?? o.percent}%)
                  {o.appendix && <em> {o.appendix}</em>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Особые достижения (п. 64, 71)</legend>
          <div className="checkbox-grid">
            {ACHIEVEMENT_OPTIONS.map((a) => (
              <label key={a.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={input.selectedAchievementIds.includes(a.id)}
                  onChange={() =>
                    set('selectedAchievementIds', toggleArray(input.selectedAchievementIds, a.id))
                  }
                />
                <span>{a.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label>
          Стаж в подразделении ЗГТ (п. 72)
          <FieldControl>
            <select value={input.zgtStazhId} onChange={(e) => set('zgtStazhId', e.target.value)}>
              {ZGT_STAZH_OPTIONS.map((z) => (
                <option key={z.id} value={z.id}>{z.label}</option>
              ))}
            </select>
          </FieldControl>
        </label>

        <label>
          Стаж шифровальной работы (п. 74–75)
          <FieldControl>
            <select value={input.cipherStazhId} onChange={(e) => set('cipherStazhId', e.target.value)}>
              {CIPHER_STAZH_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </FieldControl>
        </label>

        <label>
          Юридическая надбавка (п. 76)
          <FieldControl>
            <select
              value={input.legalAllowanceId}
              onChange={(e) => set('legalAllowanceId', e.target.value)}
            >
              {LEGAL_ALLOWANCE_OPTIONS.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </FieldControl>
        </label>
        {input.legalAllowanceId !== 'legal_none' && (
          <label>
            % (до максимума)
            <input
              type="number"
              min={1}
              max={
                LEGAL_ALLOWANCE_OPTIONS.find((l) => l.id === input.legalAllowanceId)?.maxPercent ?? 50
              }
              value={
                input.legalCustomPercent ??
                LEGAL_ALLOWANCE_OPTIONS.find((l) => l.id === input.legalAllowanceId)?.maxPercent ??
                0
              }
              onChange={(e) => set('legalCustomPercent', Number(e.target.value))}
            />
          </label>
        )}
      </Section>

      <Section title="Надбавка за риск (п. 55–61)">
        <label>
          Общая надбавка за риск, % (до 100, п. 55)
          <input
            type="number"
            min={0}
            max={100}
            value={input.manualRiskPercent ?? 0}
            onChange={(e) => set('manualRiskPercent', Number(e.target.value) || undefined)}
          />
        </label>

        <label>
          Дней полевых занятий (п. 57)
          <input
            type="number"
            min={0}
            value={input.risk.fieldExerciseDays}
            onChange={(e) => setRisk('fieldExerciseDays', Number(e.target.value))}
          />
        </label>

        <label>
          № прыжка с парашютом в году (п. 58)
          <input
            type="number"
            min={0}
            value={input.risk.parachuteJumpNumber}
            onChange={(e) => setRisk('parachuteJumpNumber', Number(e.target.value))}
          />
        </label>

        <label>
          Факторы усложнения прыжка (0–2)
          <input
            type="number"
            min={0}
            max={2}
            value={input.risk.parachuteComplexityFactors}
            onChange={(e) => setRisk('parachuteComplexityFactors', Number(e.target.value))}
          />
        </label>

        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={input.risk.parachuteInstructor}
            onChange={(e) => setRisk('parachuteInstructor', e.target.checked)}
          />
          Инструктор ПДП
        </label>

        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={input.risk.parachuteSportMaster}
            onChange={(e) => setRisk('parachuteSportMaster', e.target.checked)}
          />
          Мастер спорта по парашютному спорту
        </label>

        <label>
          Дней взрывотехнических работ (п. 59)
          <input
            type="number"
            min={0}
            value={input.risk.explosiveWorkDays}
            onChange={(e) => setRisk('explosiveWorkDays', Number(e.target.value))}
          />
        </label>

        <label>
          Степень опасности взрывных работ
          <FieldControl>
            <select
              value={input.risk.explosiveDangerLevel}
              onChange={(e) =>
                setRisk('explosiveDangerLevel', Number(e.target.value) as 1 | 2 | 3)
              }
            >
              <option value={3}>3-я (3%/день)</option>
              <option value={2}>2-я (2%/день)</option>
              <option value={1}>1-я (1%/день)</option>
            </select>
          </FieldControl>
        </label>

        <label>
          Дней тушения пожаров (п. 60)
          <input
            type="number"
            min={0}
            value={input.risk.firefightingDays}
            onChange={(e) => setRisk('firefightingDays', Number(e.target.value))}
          />
        </label>

        <fieldset>
          <legend>Водолазные часы по глубине (п. 56)</legend>
          {(
            [
              ['diverHoursBand1', 'до 6 м'],
              ['diverHoursBand2', '6–12 м'],
              ['diverHoursBand3', '12–20 м'],
              ['diverHoursBand4', '20–30 м'],
              ['diverHoursBand5', '30–40 м'],
              ['diverHoursBand6', '40–50 м'],
              ['diverHoursBand7', '50–60 м'],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min={0}
                step={0.5}
                value={input.risk[key]}
                onChange={(e) => setRisk(key, Number(e.target.value))}
              />
            </label>
          ))}
        </fieldset>
      </Section>

      <Section title="Иные выплаты и период (главы VII, IX)">
        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={input.fullPremium}
            onChange={(e) => set('fullPremium', e.target.checked)}
          />
          Премия 25% (снять — дисциплинарное взыскание 5%, п. 80)
        </label>

        <label>
          Отработано дней (пропорциональный расчёт, п. 11)
          <input
            type="number"
            min={0}
            max={31}
            placeholder="Полный месяц"
            value={input.daysWorked ?? ''}
            onChange={(e) =>
              set('daysWorked', e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </label>

        <label>
          Календарных дней в месяце
          <input
            type="number"
            min={28}
            max={31}
            value={input.daysInMonth ?? 30}
            onChange={(e) => set('daysInMonth', Number(e.target.value))}
          />
        </label>
      </Section>
    </form>
  );
}
