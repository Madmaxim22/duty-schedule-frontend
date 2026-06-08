import { ACHIEVEMENT_OPTIONS, CIPHER_STAZH_OPTIONS, CLASS_QUAL_OPTIONS, DEFAULT_RISK_INPUT, LEGAL_ALLOWANCE_OPTIONS, OUS_OPTIONS, RISK_MAX_PERCENT, STATE_SECRET_OPTIONS, ZGT_STAZH_OPTIONS, type OusSummationGroup } from '../data/allowances';
import { effectiveRegionalCoeff, REGIONAL_ZONES } from '../data/regionalCoeffs';
import { getSeniorityPercent, RANKS } from '../data/ranks';
import { getTariffSalary, PLATOON_COMMANDER_SALARY } from '../data/tariffGrades';
import { NDFL_PERCENT } from '../data/taxes';
import type { AllowanceContext, PayrollInput, PayrollLineItem, PayrollResult } from '../types/payroll';

function pct(base: number, percent: number): number {
  return Math.round((base * percent) / 100);
}

function applyRegional(amount: number, ctx: AllowanceContext): number {
  return Math.round(amount * ctx.regionalCoeff);
}

function sumGroupPercents(ids: string[], custom: Record<string, number>, group: OusSummationGroup): number {
  const selected = OUS_OPTIONS.filter((o) => ids.includes(o.id) && o.group === group);
  if (selected.length === 0) return 0;

  if (group === 'specnaz_max') {
    return Math.max(...selected.map((o) => custom[o.id] ?? o.percent));
  }

  const percents = selected.map((o) => {
    const p = custom[o.id] ?? o.percent;
    return o.maxPercent ? Math.min(p, o.maxPercent) : p;
  });

  if (group === 'special_max50') return Math.min(percents.reduce((a, b) => a + b, 0), 50);
  if (group === 'leadership30') return Math.min(percents.reduce((a, b) => a + b, 0), 30);
  if (group === 'foreign20') return Math.min(percents[0] ?? 0, 20);

  return percents.reduce((a, b) => a + b, 0);
}

function calcOusPercent(selectedIds: string[], custom: Record<string, number>): { percent: number; notes: string[] } {
  const notes: string[] = [];
  const specnaz = sumGroupPercents(selectedIds, custom, 'specnaz_max');
  const special50 = sumGroupPercents(selectedIds, custom, 'special_max50');
  const leadership = sumGroupPercents(selectedIds, custom, 'leadership30');
  const foreign = sumGroupPercents(selectedIds, custom, 'foreign20');

  const standardSelected = OUS_OPTIONS.filter(
    (o) => selectedIds.includes(o.id) && o.group === 'standard',
  );
  const standardSum = standardSelected.reduce((sum, o) => {
    const p = custom[o.id] ?? o.percent;
    const capped = o.maxPercent ? Math.min(p, o.maxPercent) : p;
    return sum + capped;
  }, 0);

  let total = standardSum + specnaz + special50 + leadership + foreign;
  if (total > 100) {
    notes.push(`ОУС ограничена 100% (п. 53): было ${total}%`);
    total = 100;
  }

  if (standardSum > 0) notes.push(`П. 52: ${standardSum}%`);
  if (specnaz > 0) notes.push(`Спецподразделения: max ${specnaz}% (п. 52 п.6)`);
  if (special50 > 0) notes.push(`Прил. №7 (п. 13): ${special50}%`);
  if (leadership > 0) notes.push(`Руководство (п. 15): ${leadership}%`);
  if (foreign > 0) notes.push(`Иностр. языки (п. 17): ${foreign}%`);

  return { percent: total, notes };
}

function calcAchievements(selectedIds: string[]): { percent: number; lines: PayrollLineItem[] } {
  const lines: PayrollLineItem[] = [];
  const pickOneGroups = new Map<string, number>();
  let sumPercent = 0;

  for (const id of selectedIds) {
    const opt = ACHIEVEMENT_OPTIONS.find((a) => a.id === id);
    if (!opt) continue;

    if (opt.pickOneGroup) {
      const current = pickOneGroups.get(opt.pickOneGroup) ?? 0;
      if (opt.percent > current) pickOneGroups.set(opt.pickOneGroup, opt.percent);
    } else if (opt.oneMonth) {
      lines.push({
        id: `ach_${id}`,
        label: opt.label,
        base: 0,
        percent: opt.percent,
        amount: 0,
        note: 'Выплата за один месяц (п. 71)',
        legalRef: 'п. 64, 71',
      });
      sumPercent += opt.percent;
    } else {
      sumPercent += opt.percent;
      lines.push({
        id: `ach_${id}`,
        label: opt.label,
        base: 0,
        percent: opt.percent,
        amount: 0,
        legalRef: 'п. 64',
      });
    }
  }

  for (const [, p] of pickOneGroups) sumPercent += p;

  return { percent: sumPercent, lines };
}

function calcParachuteRiskPercent(input: PayrollInput['risk']): number {
  const n = input.parachuteJumpNumber;
  if (n <= 0) return 0;

  let base: number;
  if (input.parachuteSportMaster) base = 13;
  else if (input.parachuteInstructor) base = 11;
  else if (n === 1) base = 6;
  else if (n <= 25) base = 6.5;
  else if (n <= 50) base = 7;
  else if (n <= 100) base = 8.5;
  else base = 10;

  const complexity = Math.min(input.parachuteComplexityFactors, 2) * 2;
  return Math.min(base + complexity, 50);
}

function calcDiverRiskAmount(platoonSalary: number, input: PayrollInput['risk']): number {
  const bands = [
    { hours: input.diverHoursBand1, pct: 1.5 },
    { hours: input.diverHoursBand2, pct: 3 },
    { hours: input.diverHoursBand3, pct: 5 },
    { hours: input.diverHoursBand4, pct: 7 },
    { hours: input.diverHoursBand5, pct: 10 },
    { hours: input.diverHoursBand6, pct: 15 },
    { hours: input.diverHoursBand7, pct: 20 },
  ];
  let total = 0;
  for (const b of bands) {
    total += pct(platoonSalary, b.pct) * b.hours;
  }
  return total;
}

function calcRiskAllowances(input: PayrollInput, ctx: AllowanceContext): PayrollLineItem[] {
  const lines: PayrollLineItem[] = [];
  const r = input.risk ?? DEFAULT_RISK_INPUT;
  const ps = ctx.platoonCommanderSalary;
  const pos = ctx.positionSalary;

  if (r.fieldExerciseDays > 0) {
    const pctDay = Math.min(r.fieldExerciseDays, 60);
    const amount = pct(ps, pctDay);
    lines.push({
      id: 'risk_field',
      label: 'Надбавка за риск: полевые занятия',
      base: ps,
      percent: pctDay,
      amount,
      legalRef: 'п. 57',
      note: `${r.fieldExerciseDays} дн., max 60%/мес.`,
    });
  }

  const paraPct = calcParachuteRiskPercent(r);
  if (paraPct > 0) {
    lines.push({
      id: 'risk_para',
      label: 'Надбавка за риск: прыжки с парашютом',
      base: ps,
      percent: paraPct,
      amount: pct(ps, paraPct),
      legalRef: 'п. 58',
    });
  }

  if (r.explosiveWorkDays > 0) {
    const dayPct = r.explosiveDangerLevel === 1 ? 1 : r.explosiveDangerLevel === 2 ? 2 : 3;
    const totalPct = Math.min(dayPct * r.explosiveWorkDays, 50);
    lines.push({
      id: 'risk_explosive',
      label: 'Надбавка за риск: взрывотехнические работы',
      base: ps,
      percent: totalPct,
      amount: pct(ps, totalPct),
      legalRef: 'п. 59',
    });
  }

  if (r.firefightingDays > 0) {
    const totalPct = Math.min(r.firefightingDays * 3, 50);
    lines.push({
      id: 'risk_fire',
      label: 'Надбавка за риск: тушение пожаров',
      base: ps,
      percent: totalPct,
      amount: pct(ps, totalPct),
      legalRef: 'п. 60',
    });
  }

  const diverAmount = calcDiverRiskAmount(ps, r);
  if (diverAmount > 0) {
    lines.push({
      id: 'risk_diver',
      label: 'Надбавка за риск: водолазные работы',
      base: ps,
      amount: diverAmount,
      legalRef: 'п. 56',
    });
  }

  if (input.manualRiskPercent && input.manualRiskPercent > 0) {
    const capped = Math.min(input.manualRiskPercent, RISK_MAX_PERCENT);
    lines.push({
      id: 'risk_manual',
      label: 'Надбавка за риск (общая, п. 55)',
      base: pos,
      percent: capped,
      amount: pct(pos, capped),
      legalRef: 'п. 55',
    });
  }

  const totalRisk = lines.reduce((s, l) => s + l.amount, 0);
  const maxRisk = pct(pos, RISK_MAX_PERCENT);
  if (totalRisk > maxRisk && lines.length > 1) {
    const scale = maxRisk / totalRisk;
    for (const l of lines) l.amount = Math.round(l.amount * scale);
    lines.push({
      id: 'risk_cap',
      label: '— ограничение надбавки за риск',
      base: 0,
      amount: 0,
      note: `Сумма ограничена ${RISK_MAX_PERCENT}% от оклада по должности (п. 55)`,
    });
  }

  return lines;
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const warnings: string[] = [];
  const lines: PayrollLineItem[] = [];

  const rank = RANKS.find((r) => r.id === input.rankId);
  if (!rank) throw new Error('Неизвестное звание');

  const gradeSalary = getTariffSalary(input.tariffGrade);
  const actingSalary = input.actingTariffGrade ? getTariffSalary(input.actingTariffGrade) : 0;
  let positionSalary = Math.max(gradeSalary, actingSalary);
  if (input.savedPositionSalary && input.savedPositionSalary > positionSalary) {
    positionSalary = input.savedPositionSalary;
    warnings.push('Применён сохранённый оклад по должности (п. 25)');
  }

  const rankSalary = rank.salary;
  const ods = rankSalary + positionSalary;

  const zone = REGIONAL_ZONES.find((z) => z.id === input.regionalZoneId) ?? REGIONAL_ZONES[0];
  const customZ = input.regionalZoneId === 'custom' ? input.customRegional : undefined;
  const regionalCoeff = effectiveRegionalCoeff(zone, customZ);
  const regionalSeniorityPercent = customZ?.seniorityPercent ?? zone.seniorityPercent;

  const ctx: AllowanceContext = {
    rankSalary,
    positionSalary,
    ods,
    platoonCommanderSalary: PLATOON_COMMANDER_SALARY,
    regionalCoeff,
    regionalSeniorityPercent,
  };

  lines.push({
    id: 'rank',
    label: 'Оклад по воинскому званию',
    base: rankSalary,
    amount: applyRegional(rankSalary, ctx),
    legalRef: 'п. 14, II',
  });

  lines.push({
    id: 'position',
    label: 'Оклад по воинской должности',
    base: positionSalary,
    amount: applyRegional(positionSalary, ctx),
    note: `Тарифный разряд ${input.tariffGrade}`,
    legalRef: 'п. 20, III',
  });

  const seniorityPct = getSeniorityPercent(input.seniorityYears);
  if (seniorityPct > 0) {
    lines.push({
      id: 'seniority',
      label: 'Надбавка за выслугу лет',
      base: ods,
      percent: seniorityPct,
      amount: applyRegional(pct(ods, seniorityPct), ctx),
      legalRef: 'п. 44',
    });
  }

  if (regionalSeniorityPercent > 0) {
    const rkBase = applyRegional(rankSalary, ctx) + applyRegional(positionSalary, ctx) +
      (seniorityPct > 0 ? applyRegional(pct(ods, seniorityPct), ctx) : 0);
    lines.push({
      id: 'regional_seniority',
      label: 'Процентная надбавка за стаж в районе',
      base: rkBase,
      percent: regionalSeniorityPercent,
      amount: Math.round((rkBase * regionalSeniorityPercent) / 100),
      legalRef: 'п. 89, ПП №58',
    });
  }

  const classOpt = CLASS_QUAL_OPTIONS.find((c) => c.id === input.classQualId);
  if (classOpt && classOpt.percent > 0) {
    lines.push({
      id: 'class_qual',
      label: 'Надбавка за классную квалификацию',
      base: positionSalary,
      percent: classOpt.percent,
      amount: pct(positionSalary, classOpt.percent),
      legalRef: 'п. 46',
    });
  }

  const secretOpt = STATE_SECRET_OPTIONS.find((s) => s.id === input.stateSecretId);
  if (secretOpt && secretOpt.percent > 0) {
    const p = input.stateSecretCustomPercent ?? secretOpt.percent;
    lines.push({
      id: 'state_secret',
      label: 'Надбавка за работу с гостайной',
      base: positionSalary,
      percent: p,
      amount: pct(positionSalary, p),
      legalRef: 'п. 50–51',
    });
  }

  const { percent: ousPct, notes: ousNotes } = calcOusPercent(input.selectedOusIds, input.ousCustomPercents);
  if (ousPct > 0) {
    lines.push({
      id: 'ous',
      label: 'Надбавка за особые условия службы',
      base: positionSalary,
      percent: ousPct,
      amount: pct(positionSalary, ousPct),
      legalRef: 'п. 52–53',
      note: ousNotes.join('; '),
    });
    for (const id of input.selectedOusIds) {
      const o = OUS_OPTIONS.find((x) => x.id === id);
      if (!o) continue;
      const p = input.ousCustomPercents[id] ?? o.percent;
      const effective = o.maxPercent ? Math.min(p, o.maxPercent) : p;
      lines.push({
        id: `ous_detail_${id}`,
        label: `  ↳ ${o.label}`,
        base: 0,
        percent: effective,
        amount: 0,
        note: o.appendix ?? 'п. 52–53',
      });
    }
  }

  const { percent: achPct, lines: achLines } = calcAchievements(input.selectedAchievementIds);
  if (achPct > 0) {
    lines.push({
      id: 'achievements',
      label: 'Надбавка за особые достижения',
      base: positionSalary,
      percent: achPct,
      amount: pct(positionSalary, achPct),
      legalRef: 'п. 64, 71',
    });
    lines.push(...achLines.map((l) => ({ ...l, amount: pct(positionSalary, l.percent ?? 0) })));
  }

  const zgt = ZGT_STAZH_OPTIONS.find((z) => z.id === input.zgtStazhId);
  if (zgt && zgt.percent > 0) {
    lines.push({
      id: 'zgt',
      label: 'Надбавка за стаж в подразделении ЗГТ',
      base: positionSalary,
      percent: zgt.percent,
      amount: pct(positionSalary, zgt.percent),
      legalRef: 'п. 72–73',
    });
  }

  const cipher = CIPHER_STAZH_OPTIONS.find((c) => c.id === input.cipherStazhId);
  if (cipher && cipher.percent > 0) {
    lines.push({
      id: 'cipher',
      label: 'Надбавка за стаж шифровальной работы',
      base: positionSalary,
      percent: cipher.percent,
      amount: pct(positionSalary, cipher.percent),
      legalRef: 'п. 74–75',
    });
  }

  const legal = LEGAL_ALLOWANCE_OPTIONS.find((l) => l.id === input.legalAllowanceId);
  if (legal && legal.maxPercent > 0) {
    const p = input.legalCustomPercent ?? legal.maxPercent;
    lines.push({
      id: 'legal',
      label: 'Юридическая надбавка',
      base: positionSalary,
      percent: p,
      amount: pct(positionSalary, p),
      legalRef: 'п. 76',
    });
  }

  const riskLines = calcRiskAllowances(input, ctx);
  lines.push(...riskLines);

  const subtotalBeforePremium = lines.reduce((s, l) => s + l.amount, 0);
  const premiumPct = input.fullPremium ? 25 : 5;
  const premium = pct(ods, premiumPct);
  lines.push({
    id: 'premium',
    label: input.fullPremium ? 'Премия (25% ОДС)' : 'Премия при дисциплинарном взыскании (5%)',
    base: ods,
    percent: premiumPct,
    amount: premium,
    legalRef: 'п. 80',
  });

  let totalMonthly = subtotalBeforePremium + premium;

  if (input.daysWorked && input.daysInMonth && input.daysWorked < input.daysInMonth) {
    const factor = input.daysWorked / input.daysInMonth;
    totalMonthly = Math.round(totalMonthly * factor);
    warnings.push(
      `Пропорциональный расчёт за ${input.daysWorked} из ${input.daysInMonth} дней (п. 11)`,
    );
  }

  const ndfl = pct(totalMonthly, NDFL_PERCENT);
  const netMonthly = totalMonthly - ndfl;

  const annualMaterialAid = ods;
  const annualMaterialAidNdfl = pct(annualMaterialAid, NDFL_PERCENT);
  const annualMaterialAidNet = annualMaterialAid - annualMaterialAidNdfl;

  return {
    rankSalary,
    positionSalary,
    ods,
    regionalCoeff,
    regionalSeniorityPercent,
    lines,
    subtotalBeforePremium,
    premium,
    totalMonthly,
    ndfl,
    ndflPercent: NDFL_PERCENT,
    netMonthly,
    annualMaterialAid,
    annualMaterialAidNdfl,
    annualMaterialAidNet,
    warnings,
  };
}
