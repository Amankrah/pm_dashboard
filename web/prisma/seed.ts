import "dotenv/config";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

function sqliteUrl() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const file = url.replace(/^file:/, "");
  const resolved = path.isAbsolute(file)
    ? file
    : path.join(process.cwd(), file);
  return `file:${resolved}`;
}

const adapter = new PrismaBetterSqlite3({ url: sqliteUrl() });
const prisma = new PrismaClient({ adapter });

const SAMPLE_SUBMISSIONS = [
  {
    respondent: {
      full_name: "Dr. Sarah Osei",
      email: "sarah.osei@mcgill.ca",
      faculty: "Agricultural and Environmental Sciences (AES)",
      department: "Bioresource Engineering",
      position: "Associate Professor",
      submission_date: "2026-04-28",
    },
    activities: [
      {
        title: "Climate-Smart Agriculture Curriculum Module",
        themes: ["Education"],
        status: "Ongoing",
        description:
          "Co-developing curriculum on climate-smart agriculture with KNUST faculty.",
        start_date: "2026-01-15",
        end_date: "2026-08-30",
        partner_institution:
          "Kwame Nkrumah University of Science and Technology (KNUST)",
        contact_name: "Prof. Kweku Mensah",
        contact_email: "k.mensah@knust.edu.gh",
        outputs: "Joint curriculum module, teaching resource pack",
      },
      {
        title: "Youth Agri-Food Entrepreneurship Workshop",
        themes: ["Entrepreneurship"],
        status: "Completed",
        description:
          "Three-day workshop on agri-food business development for youth.",
        start_date: "2026-02-10",
        end_date: "2026-02-12",
        partner_institution: "Association of Ghana Industries",
        contact_name: "Ms. Ama Boateng",
        contact_email: "a.boateng@agi.com.gh",
        outputs: "Workshop report, 45 youth participants trained",
      },
    ],
    additional: {
      resources_needed: "Travel funds for field visit to KNUST",
      challenges_barriers: "Time zone differences affect scheduling",
      outcomes_achievements:
        "Curriculum draft complete; workshop reached 45 youth",
      collaboration_opportunities:
        "Potential SPGH collaboration on nutrition component",
    },
  },
  {
    respondent: {
      full_name: "Prof. James Asante",
      email: "james.asante@mcgill.ca",
      faculty: "School of Population and Global Health (SPGH)",
      department: "Global and Community Health",
      position: "Professor",
      submission_date: "2026-05-02",
    },
    activities: [
      {
        title: "Nutrition-Sensitive Food Systems Research",
        themes: ["Education", "Access"],
        status: "Ongoing",
        description:
          "Joint research on improving nutritional outcomes in rural Ghana.",
        start_date: "2026-03-01",
        end_date: "2026-12-31",
        partner_institution:
          "University of Health and Allied Sciences (UHAS)",
        contact_name: "Dr. Abena Frimpong",
        contact_email: "a.frimpong@uhas.edu.gh",
        outputs: "Research paper, policy brief",
      },
    ],
    additional: {
      outcomes_achievements: "Research protocol approved by ethics board",
    },
  },
];

async function main() {
  const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const defaultAdmin =
    process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() ||
    "ebenezer.kwofie@mcgill.ca";

  const emails = new Set([defaultAdmin, ...allowedEmails]);
  for (const email of emails) {
    await prisma.allowedUser.upsert({
      where: { email },
      create: {
        email,
        role: email === defaultAdmin ? "admin" : "viewer",
      },
      update: {},
    });
  }

  // Default seeded period: Y2Q3. The Mastercard Foundation Partner Narrative
  // Report uses YnQq notation; the dashboard uses the same. The legacy
  // "ay-2025-26" slug is preserved for backward compatibility with any
  // pre-existing dev fixtures, but new local dev databases will be created
  // with the quarterly fields populated.
  const period = await prisma.reportingPeriod.upsert({
    where: { slug: "y2q3" },
    create: {
      label: "Year 2 Quarter 3",
      slug: "y2q3",
      programYear: 2,
      quarter: 3,
      reportKey: "Y2Q3",
      startDate: "2026-04-01",
      endDate: "2026-06-30",
      status: "open",
    },
    update: {
      programYear: 2,
      quarter: 3,
      reportKey: "Y2Q3",
    },
  });

  // Sample submissions are OPT-IN. They are only useful for dashboard
  // walkthroughs and local UI development; production deployments must
  // start with a clean database. To load them in dev, run:
  //   SEED_SAMPLES=true npm run db:seed
  const loadSamples = process.env.SEED_SAMPLES === "true";

  const existingCount = await prisma.submission.count({
    where: { periodId: period.id },
  });

  if (loadSamples && existingCount === 0) {
    for (const sample of SAMPLE_SUBMISSIONS) {
      const sub = await prisma.submission.create({
        data: {
          periodId: period.id,
          fullName: sample.respondent.full_name,
          email: sample.respondent.email,
          faculty: sample.respondent.faculty,
          department: sample.respondent.department,
          position: sample.respondent.position,
          submissionDate: sample.respondent.submission_date,
          resourcesNeeded: sample.additional?.resources_needed ?? null,
          collaborationOpportunities:
            sample.additional?.collaboration_opportunities ?? null,
          challengesBarriers: sample.additional?.challenges_barriers ?? null,
          outcomesAchievements: sample.additional?.outcomes_achievements ?? null,
          activities: {
            create: sample.activities.map((act) => ({
              title: act.title,
              status: act.status,
              description: act.description ?? null,
              startDate: act.start_date ?? null,
              endDate: act.end_date ?? null,
              partnerInstitution: act.partner_institution,
              contactName: act.contact_name,
              contactEmail: act.contact_email,
              outputs: act.outputs ?? null,
              themes: {
                create: act.themes.map((theme) => ({ theme })),
              },
            })),
          },
        },
      });
      console.log("Seeded submission:", sub.fullName);
    }
  }

  console.log("Seed complete. Allowed users:", [...emails].join(", "));
  if (!loadSamples) {
    console.log(
      "Sample submissions skipped (SEED_SAMPLES not set to 'true'). Production starts empty.",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
