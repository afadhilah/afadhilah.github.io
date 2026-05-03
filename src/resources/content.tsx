import { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";
import { Line, Row, Text } from "@once-ui-system/core";
import contentData from "./content-data.json";

const person: Person = {
  ...contentData.person,
} as Person;

const newsletter: Newsletter = {
  display: contentData.newsletter.display,
  title: <>{contentData.newsletter.title}</>,
  description: <>{contentData.newsletter.description}</>,
};

const social: Social = contentData.social.map((s) => ({
  ...s,
})) as Social;

const home: Home = {
  path: contentData.home.path,
  image: contentData.home.image,
  label: contentData.home.label,
  title: contentData.home.title,
  description: contentData.home.description,
  headline: <>{contentData.home.headline}</>,
  featured: {
    display: contentData.home.featured.display,
    title: (
      <Row gap="12" vertical="center">
        <strong className="ml-4">{contentData.home.featured.title}</strong>{" "}
        <Line background="brand-alpha-strong" vert height="20" />
        <Text marginRight="4" onBackground="brand-medium">
          Featured work
        </Text>
      </Row>
    ),
    href: contentData.home.featured.href,
  },
  subline: <>{contentData.home.subline}</>,
};

const about: About = {
  path: contentData.about.path,
  label: contentData.about.label,
  title: contentData.about.title,
  description: contentData.about.description,
  tableOfContent: contentData.about.tableOfContent,
  avatar: contentData.about.avatar,
  calendar: contentData.about.calendar,
  intro: {
    display: contentData.about.intro.display,
    title: contentData.about.intro.title,
    description: <>{contentData.about.intro.description}</>,
  },
  work: {
    display: contentData.about.work.display,
    title: contentData.about.work.title,
    experiences: contentData.about.work.experiences.map((exp) => ({
      company: exp.company,
      timeframe: exp.timeframe,
      role: exp.role,
      achievements: exp.achievements.map((a) => <>{a}</>),
      images: exp.images,
    })),
  },
  studies: {
    display: contentData.about.studies.display,
    title: contentData.about.studies.title,
    institutions: contentData.about.studies.institutions.map((inst) => ({
      name: inst.name,
      description: <>{inst.description}</>,
    })),
  },
  technical: {
    display: contentData.about.technical.display,
    title: contentData.about.technical.title,
    skills: contentData.about.technical.skills.map((skill) => ({
      title: skill.title,
      description: <>{skill.description}</>,
      tags: skill.tags,
      images: skill.images,
    })),
  },
};

const blog: Blog = {
  ...contentData.blog,
};

const work: Work = {
  ...contentData.work,
};

const gallery: Gallery = {
  ...contentData.gallery,
};

export { person, social, newsletter, home, about, blog, work, gallery };
