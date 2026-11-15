import { createFileRoute } from '@tanstack/react-router';
import { ArrowUpRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TEAM } from '@/lib/team';
import teamImage from '@/assets/cysa-sphere-team.png.asset.json';

export const Route = createFileRoute('/contact')({
  head: () => ({ meta: [
    { title: 'Contact CYSA Sphere — Earth Jukebox' },
    { name: 'description', content: 'Meet CYSA Sphere, the four women in STEM behind Earth Jukebox. Contact the team about museum pilots, school partnerships and accessible Earth exploration.' },
    { property: 'og:title', content: 'Contact CYSA Sphere — Earth Jukebox' },
    { property: 'og:description', content: 'Meet the Earth Jukebox team and get in touch about museums, schools and accessibility partnerships.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ContactPage,
});

function ContactPage() {
  return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
    <header className="max-w-3xl">
      <p className="text-sm font-bold uppercase text-primary">Earth Jukebox · Get in touch</p>
      <h1 className="mt-2 font-display text-5xl font-bold">Contact CYSA Sphere</h1>
      <p className="mt-4 text-xl text-muted-foreground">Four women in STEM. One shared ambition: a planet every child can explore.</p>
    </header>

    <figure className="mt-8">
      <img src={teamImage.url} alt="Earth Jukebox team card featuring the four CYSA Sphere members: Stefania Pana, Claudia Banesanu, Buescu Ana Maria and Ioana Baciu." width={922} height={768} fetchPriority="high" className="mx-auto h-auto w-full max-w-3xl rounded-lg border border-border" />
      <figcaption className="mt-3 text-center text-sm text-muted-foreground">CYSA Sphere · NASA Space Apps 2026 · Bucharest</figcaption>
    </figure>

    <section aria-labelledby="team-contact" className="mt-10 border-t border-border pt-8">
      <div className="flex items-center gap-3"><Mail className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" /><h2 id="team-contact" className="font-display text-3xl font-bold">Meet the team</h2></div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {TEAM.map((member, index) => <li key={member.email} className="min-w-0 rounded-lg border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <span className={`grid h-12 w-12 place-items-center rounded-full font-display text-xl font-bold ${index % 2 === 0 ? 'bg-accent/15 text-accent' : 'bg-primary/15 text-primary'}`} aria-hidden="true">{member.initials}</span>
            <span className="text-xs font-bold uppercase text-muted-foreground">CYSA Sphere</span>
          </div>
          <h3 className="font-display text-2xl font-bold">{member.name}</h3>
          <address className="mt-2 not-italic">
            <Button asChild variant="link" className="h-auto max-w-full justify-start gap-2 whitespace-normal p-0 text-left text-base">
              <a href={`mailto:${member.email}`} aria-label={`Email ${member.name} at ${member.email}`}>
                <span className="min-w-0 break-all">{member.email}</span><ArrowUpRight className="shrink-0" aria-hidden="true" />
              </a>
            </Button>
          </address>
        </li>)}
      </ul>
    </section>

    <section aria-labelledby="partnerships" className="mt-10 border-t border-border py-8">
      <p className="text-sm font-bold uppercase text-accent">Museums · Schools · Accessibility</p>
      <h2 id="partnerships" className="mt-2 font-display text-3xl font-bold">Let’s make Earth exploration more inclusive.</h2>
      <p className="mt-4 max-w-3xl text-lg text-muted-foreground">We’d love to connect with museums, educators and accessibility partners interested in Earth Jukebox, co-design or future pilots.</p>
    </section>
  </div>;
}