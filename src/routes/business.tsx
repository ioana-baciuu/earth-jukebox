import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, Check, Handshake, Headphones, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ANNUAL_COSTS, ILLUSTRATIVE_SCENARIO, KIOSK_COSTS, LAUNCH_COSTS, PRICING, REPAIR_RESERVE, breakEvenUnits, sumCosts, type CostItem } from '@/lib/business-estimates';

export const Route = createFileRoute('/business')({
  head: () => ({ meta: [
    { title: 'Business & Costs — Earth Jukebox' },
    { name: 'description', content: 'Earth Jukebox museum kiosk planning: estimated hardware and launch costs, proposed pricing, funding routes and accessible pilot priorities.' },
    { property: 'og:title', content: 'Business & Costs — Earth Jukebox' },
    { property: 'og:description', content: 'A planning roadmap for bringing an accessible NASA sound globe to museums and schools. Estimates, not supplier quotes.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: BusinessPage,
});

const euro = (value: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
const range = (low: number, high: number) => `${euro(low)}–${euro(high)}`;

function CostTable({ title, id, items, total, period }: { title: string; id: string; items: CostItem[]; total?: string; period: string }) {
  return <section aria-labelledby={id} className="border-t border-border py-8 sm:py-10">
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={id} className="font-display text-3xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{period} · estimated EUR</p>
    </div>
    <table className="w-full table-fixed text-left">
      <caption className="sr-only">{title}: {period}, estimated costs in euros</caption>
      <thead className="border-b border-border text-sm text-muted-foreground"><tr>
        <th scope="col" className="w-[64%] pb-3 pr-3 font-normal sm:w-[72%]">Item</th>
        <th scope="col" className="pb-3 text-right font-normal">Estimate</th>
      </tr></thead>
      <tbody>{items.map(item => <tr key={item.name} className="border-b border-border/50">
        <th scope="row" className="py-4 pr-3 font-normal"><span className="font-bold">{item.name}</span>{item.note && <span className="mt-1 block text-sm text-muted-foreground">{item.note}</span>}</th>
        <td className="py-4 text-right align-top text-sm font-bold tabular-nums sm:text-base">{range(item.low, item.high)}</td>
      </tr>)}</tbody>
      {total && <tfoot><tr><th scope="row" className="pt-5 pr-3 text-lg">Itemised total</th><td className="pt-5 text-right font-bold text-primary tabular-nums">{total}</td></tr></tfoot>}
    </table>
  </section>;
}

const FUNDING = [
  { title: 'Museum pilot partners', text: 'Explore paid or in-kind pilots with Grigore Antipa in Bucharest and science centres in the Ecsite network. A pilot can produce visitor evidence before wider sales.' },
  { title: 'Accessibility partners', text: 'Approach the Romanian association for the blind, the European Blind Union and Perkins School for the Blind for co-design, evaluation and potential partnerships.' },
  { title: 'Education & inclusion grants', text: 'Investigate Erasmus+ calls for education and inclusion. Confirm eligibility, deadlines and co-funding requirements before applying.' },
  { title: 'Space-sector support', text: 'Explore ESA Business Incubation Centres and the Romanian Space Agency. Availability and eligibility need checking.' },
  { title: 'Corporate foundations', text: 'Research Orange and Vodafone foundations in Romania and accessibility programmes such as Google.org. No open call or funding commitment is assumed.' },
  { title: 'Pre-orders & crowdfunding', text: 'Invite schools and museums to commit to pilots before manufacturing, with clear delivery terms and realistic hardware expectations.' },
];

function BusinessPage() {
  const kiosk = sumCosts(KIOSK_COSTS);
  const launch = sumCosts(LAUNCH_COSTS);
  const annual = sumCosts(ANNUAL_COSTS);
  const scenario = ILLUSTRATIVE_SCENARIO;
  const units = breakEvenUnits(scenario.salePrice, scenario.unitCost, scenario.launchBudget);
  return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
    <header>
      <p className="text-sm font-bold uppercase text-primary">Earth Jukebox · CYSA Sphere</p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Business & Costs</h1>
      <p className="mt-4 max-w-3xl text-xl text-muted-foreground">Bringing a touch-and-listen Earth globe to museums and schools, with free web access at the heart of the idea.</p>
      <p className="mt-6 border-l-4 border-primary pl-4 text-base"><strong>Planning estimates, not a price list.</strong> Figures come from the supplied rough business estimate. They are not supplier quotes, verified operating bills or financial advice. Confirm costs, tax treatment and safety requirements before committing funds.</p>
    </header>

    <dl className="my-10 grid gap-6 border-y border-border py-7 sm:grid-cols-3">
      {[
        ['Museum kiosk', range(kiosk.low, kiosk.high), 'Estimated build, shipping & installation'],
        ['Year-one launch', range(launch.low, launch.high), 'One-time preparation and pilot budget'],
        ['Annual fixed costs', range(annual.low, annual.high), `Plus ${euro(REPAIR_RESERVE)} per kiosk repair reserve`],
      ].map(([label, value, note]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 font-display text-2xl font-bold text-primary">{value}</dd><dd className="mt-2 text-sm text-muted-foreground">{note}</dd></div>)}
    </dl>

    <section aria-labelledby="offer" className="pb-10">
      <h2 id="offer" className="font-display text-3xl font-bold">One mission. Two ways to reach children.</h2>
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <div><p className="font-bold text-accent">01 / Free web experience</p><p className="mt-2 text-muted-foreground">A proposed free learning experience for schools and families. The current web prototype demonstrates NASA image-to-sound exploration and supports conversations with educators and grant partners.</p></div>
        <div><p className="font-bold text-primary">02 / Museum station</p><p className="mt-2 text-muted-foreground">The proposed revenue-generating exhibit: a tactile globe, headphones, four dataset keys, east/west joystick and companion screen. The 3D station is a digital prototype, not manufactured or safety-certified hardware.</p>
          <Button asChild variant="ghost" className="mt-3 px-0"><Link to="/museum">See the museum prototype <ArrowUpRight aria-hidden="true" /></Link></Button>
        </div>
      </div>
    </section>

    <CostTable title="Building one museum kiosk" id="kiosk-costs" items={KIOSK_COSTS} total={range(kiosk.low, kiosk.high)} period="Per unit" />
    <p className="mb-8 text-sm text-muted-foreground">The source uses approximately €1,600 as a working unit-cost assumption; the arithmetic midpoint of the range is €1,695. This basic budget does not price integrated touch sensors, thermal or vibration feedback, or the future actuated pin-array globe. Those need separate engineering and supplier quotes.</p>

    <CostTable title="Preparing for launch" id="launch-costs" items={LAUNCH_COSTS} total={range(launch.low, launch.high)} period="Year one · one-time" />
    <CostTable title="Keeping the project running" id="annual-costs" items={ANNUAL_COSTS} total={range(annual.low, annual.high)} period="Per year · fixed costs" />
    <p className="mb-8 text-muted-foreground"><strong className="text-foreground">Repair reserve:</strong> {euro(REPAIR_RESERVE)} per kiosk per year, approximately 10% of the source’s €1,600 working unit cost. Annual planning formula: {range(annual.low, annual.high)} + {euro(REPAIR_RESERVE)} × installed kiosks. The source’s €2,500–6,500 small-scale headline is approximate and does not specify a fleet size. Hosting figures are hypothetical budgets, not measured costs for this website.</p>

    <section aria-labelledby="pricing" className="border-t border-border py-10">
      <h2 id="pricing" className="font-display text-3xl font-bold">Proposed pricing & revenue</h2>
      <p className="mt-2 text-muted-foreground">Options to validate with pilot customers; none is a current purchase offer.</p>
      <dl className="mt-6 divide-y divide-border">{PRICING.map(item => <div key={item.name} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto]">
        <div><dt className="text-lg font-bold">{item.name}</dt><dd className="mt-1 text-sm text-muted-foreground">{item.note}</dd></div>
        <dd className="font-display text-2xl font-bold text-primary">{item.high === 0 ? 'Free' : range(item.low, item.high)}</dd>
      </div>)}</dl>
      <div className="mt-6 border-l-4 border-accent pl-5">
        <h3 className="text-xl font-bold">A simplified break-even example</h3>
        <p className="mt-2 text-muted-foreground">{euro(scenario.salePrice)} sale price − {euro(scenario.unitCost)} assumed unit cost = <strong className="text-foreground">{euro(scenario.salePrice - scenario.unitCost)} contribution per kiosk</strong>. A {euro(scenario.launchBudget)} launch budget would need <strong className="text-foreground">{units} kiosks</strong> mathematically; the source suggests roughly 12 as a planning target.</p>
        <p className="mt-2 text-sm text-muted-foreground">This is not net profit or a forecast. The itemised unit budget already includes shipping and installation; do not count them twice. Support, sales overhead, taxes and unpriced hardware can reduce contribution and increase break-even. Grants may reduce the launch amount to recover.</p>
      </div>
    </section>

    <section aria-labelledby="funding" className="border-t border-border py-10">
      <div className="flex items-center gap-3"><Handshake className="h-7 w-7 text-accent" aria-hidden="true" /><h2 id="funding" className="font-display text-3xl font-bold">Potential funding & partners</h2></div>
      <p className="mt-3 text-muted-foreground">Research leads, not confirmed partners or currently verified funding opportunities.</p>
      <ul className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">{FUNDING.map(item => <li key={item.title}><h3 className="text-lg font-bold">{item.title}</h3><p className="mt-2 text-muted-foreground">{item.text}</p></li>)}</ul>
      <p className="mt-6 text-sm text-muted-foreground">Do not assume NASA Space Apps prizes fund development. Check what the specific event actually offers.</p>
    </section>

    <section aria-labelledby="sustain" className="border-t border-border py-10">
      <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-primary" aria-hidden="true" /><h2 id="sustain" className="font-display text-3xl font-bold">Sustainable, safe & inclusive</h2></div>
      <ul className="mt-6 space-y-5">{[
        ['People', 'Plan for a part-time developer, sound designer, blind or low-vision accessibility advisor, educator and partnerships lead.'],
        ['Reliable NASA data', 'Package processed datasets for offline kiosk use and retain source records, so changes to external sources do not interrupt visits. Offline deployment still requires production hardening.'],
        ['Children’s privacy & safety', 'Aim to collect no personal data from children, obtain GDPR and child-safety review, and retain the NASA non-endorsement notice. These are launch requirements, not a claim of certification.'],
        ['Renewal value', 'Consider new datasets, sounds and teaching resources each year, guided by visitor testing and museum needs rather than expansion alone.'],
      ].map(([title, text]) => <li key={title} className="flex gap-3"><Check className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden="true" /><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-muted-foreground">{text}</p></div></li>)}</ul>
    </section>

    <section aria-labelledby="pilot" className="border-t border-border py-10">
      <p className="text-sm font-bold uppercase text-primary">Next milestone</p>
      <h2 id="pilot" className="mt-2 font-display text-3xl font-bold">Start with one or two paid pilots</h2>
      <p className="mt-4 text-muted-foreground">Museum sales may take 6–12 months, hardware support needs dedicated time, and grants can arrive late. Validate reach, comprehension, durability and support needs with children and educators before scaling. Advanced tactile hardware belongs to a separately funded future phase.</p>
      <Button asChild variant="soft" className="mt-5"><Link to="/museum"><Headphones aria-hidden="true" /> Explore the station</Link></Button>
    </section>

    <footer className="border-t border-border pt-6 text-sm text-muted-foreground"><p><strong className="text-foreground">Source & assumptions:</strong> supplied “Rough business and cost estimate for Earth Jukebox”; planning figures reproduced with itemised arithmetic clarifications. Programme availability, supplier prices and actual operating spend have not been verified. All amounts are in euros; VAT treatment is unspecified.</p><p className="mt-3">NASA data informs the learning experience, not these commercial estimates. NASA does not endorse this project.</p></footer>
  </div>;
}