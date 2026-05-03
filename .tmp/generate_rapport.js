/**
 * Génère le Chapitre 1 du rapport de stage — Projet Carlow chez Solelh Energie.
 * Style inspiré des PFE de l'ISG Gabès (exemples Baaziz Islem + Samar).
 *
 * Sortie : ../rapport de stage/Rapport_PFE_Carlow_Chapitre1.docx
 *
 * Important : pour respecter la consigne "ne jamais créer de nouvelle version",
 * ce script doit toujours OVERWRITER le fichier ci-dessus, jamais en créer un autre.
 */

const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  PageBreak,
} = require("docx");

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const FONT = "Arial";
const SZ_BODY = 24; // 12pt
const SZ_H1 = 40;
const SZ_H2 = 30;
const SZ_H3 = 26;
const SZ_SMALL = 20;

const COLOR_FG = "1A1A1A";
const COLOR_PRIMARY = "C25E1F"; // orange Carlow assombri pour print
const COLOR_MUTED = "666666";
const COLOR_BORDER = "DDDDDD";

const P = (text) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 120 },
    children: [new TextRun({ text, font: FONT, size: SZ_BODY })],
  });

const PR = (runs, { align } = {}) =>
  new Paragraph({
    alignment: align ?? AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 120 },
    children: runs.map((r) =>
      typeof r === "string"
        ? new TextRun({ text: r, font: FONT, size: SZ_BODY })
        : new TextRun({ font: FONT, size: SZ_BODY, ...r })
    ),
  });

const H1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 240 },
    children: [
      new TextRun({ text, font: FONT, size: SZ_H1, bold: true, color: COLOR_PRIMARY }),
    ],
  });

const H2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 180 },
    children: [
      new TextRun({ text, font: FONT, size: SZ_H2, bold: true, color: COLOR_FG }),
    ],
  });

const H3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({ text, font: FONT, size: SZ_H3, bold: true, color: COLOR_FG }),
    ],
  });

const H4 = (text) =>
  new Paragraph({
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: SZ_BODY,
        bold: true,
        italics: true,
        color: COLOR_FG,
      }),
    ],
  });

const BULLET = (text, level = 0) =>
  new Paragraph({
    numbering: { reference: "bullets", level },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 320, after: 60 },
    children: [new TextRun({ text, font: FONT, size: SZ_BODY })],
  });

const BULLET_BOLD = (boldPart, rest, level = 0) =>
  new Paragraph({
    numbering: { reference: "bullets", level },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 320, after: 60 },
    children: [
      new TextRun({ text: boldPart, font: FONT, size: SZ_BODY, bold: true }),
      new TextRun({ text: rest, font: FONT, size: SZ_BODY }),
    ],
  });

const CAPTION = (text) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: SZ_SMALL,
        italics: true,
        color: COLOR_MUTED,
      }),
    ],
  });

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER };
const allBorders = {
  top: cellBorder,
  bottom: cellBorder,
  left: cellBorder,
  right: cellBorder,
};

const TC = (text, opts = {}) =>
  new TableCell({
    borders: allBorders,
    width: { size: opts.width ?? 4680, type: WidthType.DXA },
    shading: opts.shading
      ? { fill: opts.shading, type: ShadingType.CLEAR }
      : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            font: FONT,
            size: opts.size ?? SZ_BODY,
            bold: opts.bold,
            color: opts.color,
          }),
        ],
      }),
    ],
  });

// ─────────────────────────────────────────────────────────────────────────────
// CONTENU
// ─────────────────────────────────────────────────────────────────────────────

const children = [];

// ── PAGE DE GARDE ────────────────────────────────────────────────────────────
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 160 },
    children: [
      new TextRun({
        text: "Projet de fin d'études",
        font: FONT,
        size: 28,
        color: COLOR_MUTED,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({
        text:
          "Industrialisation de l'acquisition vendeurs et conception d'un portail",
        font: FONT,
        size: 32,
        bold: true,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [
      new TextRun({
        text: "d'onboarding pour la marketplace B2B Carlow",
        font: FONT,
        size: 32,
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [
      new TextRun({
        text: "Stage effectué au sein de la société Solelh Energie (Carlow)",
        font: FONT,
        size: SZ_BODY,
        italics: true,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [
      new TextRun({ text: "Réalisé par : Azer RAHALI", font: FONT, size: SZ_BODY }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: "Encadré par : Dr. Maryam Elamine",
        font: FONT,
        size: SZ_BODY,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: "Année universitaire : 2025 — 2026",
        font: FONT,
        size: SZ_BODY,
        color: COLOR_MUTED,
      }),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] })
);

// ── INTRODUCTION GÉNÉRALE ────────────────────────────────────────────────────
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 320 },
    children: [
      new TextRun({
        text: "Introduction générale",
        font: FONT,
        size: 44,
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  })
);
children.push(
  P(
    "L'essor du commerce électronique a profondément transformé l'organisation des échanges " +
      "commerciaux au cours de la dernière décennie. Cette transformation, longtemps cantonnée au " +
      "commerce grand public, gagne désormais le secteur inter-entreprises avec une rapidité " +
      "remarquable. Selon l'enquête internationale Sana Commerce 2023, 88 % des entreprises B2B " +
      "estiment qu'elles réaliseront leurs ventes exclusivement en ligne d'ici à 2025, et 66 % des " +
      "acheteurs B2B privilégient déjà l'approvisionnement digital. Dans ce nouveau paradigme, " +
      "l'expérience client — et particulièrement la qualité de la livraison — est devenue le " +
      "premier critère de décision d'achat, devant le prix lui-même."
  ),
  P(
    "Parallèlement, la transition énergétique européenne se traduit par une explosion de la " +
      "demande en équipements liés aux énergies renouvelables : panneaux photovoltaïques, " +
      "onduleurs, batteries, pompes à chaleur, biomasse, bornes de recharge pour véhicules " +
      "électriques (IRVE) et solutions de gestion technique du bâtiment. Le marché européen est " +
      "néanmoins extrêmement fragmenté, partagé entre fabricants asiatiques, distributeurs européens " +
      "et intégrateurs locaux, ce qui complique le sourcing pour les acheteurs professionnels et " +
      "limite la visibilité des fournisseurs spécialisés au-delà de leur zone géographique de proximité."
  ),
  P(
    "C'est précisément sur cette double dynamique — digitalisation du B2B et structuration de la " +
      "filière EnR — que s'est positionnée la société française Solelh Energie en lançant la " +
      "marketplace Carlow (carlow.fr), première place de marché européenne spécialisée dans la " +
      "distribution d'équipements pour les énergies renouvelables et les économies d'énergie, " +
      "neufs et de seconde vie. Carlow se distingue par une approche verticale, par la couverture " +
      "du circuit second-life, par un modèle économique fondé sur la commission (« pay only if sale ») " +
      "et par un positionnement assumé de tiers de confiance, qui intègre la gestion des paiements " +
      "via Stripe, la conformité réglementaire et l'accompagnement opérationnel des vendeurs."
  ),
  P(
    "C'est dans ce contexte que s'inscrit notre projet de fin d'études, réalisé au sein de Solelh " +
      "Energie sous l'encadrement de Monsieur Paul-Emile DOURS, co-fondateur de Carlow. Notre " +
      "mission présente une double dimension. Sur le plan analytique, elle vise à structurer la " +
      "démarche de prospection BtoB de la plateforme afin d'industrialiser le recrutement des " +
      "vendeurs européens, parmi les centaines de prospects déjà identifiés. Sur le plan applicatif, " +
      "elle consiste à concevoir et développer un portail web sur mesure dédié à l'onboarding des " +
      "vendeurs et à leur supervision administrative, en complément de la solution back-office " +
      "Origami Marketplace utilisée en production."
  ),
  P(
    "La solution applicative développée doit en particulier permettre de réduire significativement " +
      "le temps d'inscription d'un nouveau vendeur, de garantir la conformité réglementaire à " +
      "travers la vérification automatique des numéros de TVA intracommunautaires (service VIES " +
      "de la Commission européenne), de structurer la collecte des documents légaux et des " +
      "certifications techniques, et d'offrir à l'équipe Carlow comme aux fournisseurs une " +
      "expérience fluide, sécurisée et homogène."
  ),
  P(
    "Le présent rapport résume les différentes étapes que nous avons suivies pour mener ce projet " +
      "à bien. Il est articulé autour de trois chapitres :"
  )
);
children.push(
  BULLET_BOLD(
    "Le premier chapitre, intitulé « Étude préalable », ",
    "présente le cadre du projet, l'organisme d'accueil ainsi que son écosystème de partenaires, " +
      "puis établit une analyse comparative de l'existant afin d'en dégager les points faibles à " +
      "éviter et les points forts à reprendre. Il identifie enfin la problématique centrale, expose " +
      "la solution proposée et détaille les besoins fonctionnels et non fonctionnels du futur système."
  ),
  BULLET_BOLD(
    "Le deuxième chapitre, intitulé « Étude conceptuelle », ",
    "justifie le choix du langage de modélisation retenu, identifie les acteurs du système et " +
      "présente la conception détaillée du projet à travers les diagrammes UML : diagrammes des " +
      "cas d'utilisation, diagrammes de séquence, diagramme de classes et schéma relationnel " +
      "de la base de données."
  ),
  BULLET_BOLD(
    "Le troisième chapitre, intitulé « Réalisation », ",
    "présente l'architecture technique mise en œuvre, l'environnement de développement, les " +
      "langages et frameworks adoptés (Next.js, TypeScript, Prisma, PostgreSQL, Tailwind CSS) " +
      "ainsi que des aperçus des principales interfaces utilisateurs réalisées."
  )
);
children.push(
  P(
    "Enfin, nous clôturons ce rapport par une conclusion générale dans laquelle nous résumons " +
      "notre solution et exposons quelques perspectives d'évolution future."
  )
);
children.push(new Paragraph({ children: [new PageBreak()] }));

// ── INTERCALAIRE CHAPITRE ────────────────────────────────────────────────────
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 4000, after: 240 },
    children: [
      new TextRun({
        text: "Chapitre 1",
        font: FONT,
        size: 56,
        color: COLOR_MUTED,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 480 },
    children: [
      new TextRun({
        text: "Étude préalable",
        font: FONT,
        size: 80,
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] })
);

// ── CHAPITRE 1 ───────────────────────────────────────────────────────────────
children.push(H1("Chapitre 1 : Étude préalable"));

children.push(H2("Introduction"));
children.push(
  P(
    "L'étude préalable constitue la phase fondatrice de tout projet informatique. " +
      "Elle vise à comprendre le contexte du système, à identifier la problématique posée, " +
      "à mener une analyse comparative de l'existant et à déterminer avec précision " +
      "les objectifs et les fonctionnalités attendues du futur système."
  ),
  P(
    "Ce premier chapitre présente le cadre dans lequel s'inscrit notre projet de fin d'études, " +
      "réalisé au sein de la société Solelh Energie, qui exploite la marketplace B2B Carlow " +
      "spécialisée dans la distribution d'équipements pour les énergies renouvelables (EnR) " +
      "et les économies d'énergie. Nous y exposons d'abord l'organisme d'accueil ainsi que les " +
      "conditions de déroulement du stage. Nous procédons ensuite à une analyse approfondie des " +
      "solutions existantes sur le marché européen des marketplaces B2B verticales, afin d'en " +
      "dégager les forces et les faiblesses à prendre en considération dans la conception de notre " +
      "solution. Enfin, nous formulons la problématique, la solution proposée et le cahier des charges " +
      "fonctionnel et non fonctionnel qui guidera la suite du développement."
  )
);

// 1. Cadre du projet
children.push(H2("1. Cadre du projet"));
children.push(
  P(
    "Ce travail s'inscrit dans le cadre de notre projet de fin d'études en vue de l'obtention " +
      "du diplôme de Mastère professionnel en spécialité Commerce électronique à l'Institut Supérieur " +
      "de Gestion de Gabès (ISGG). Le projet a été réalisé au sein de la société Solelh Energie, " +
      "jeune startup française qui exploite la marketplace B2B Carlow, dédiée aux équipements liés " +
      "aux énergies renouvelables et aux économies d'énergie."
  )
);

// 1.1 Organisme d'accueil
children.push(H3("1.1 Présentation de l'organisme d'accueil"));
children.push(H4("1.1.1 Description de l'entreprise"));
children.push(
  P(
    "Solelh Energie est une jeune entreprise française opérant sous la marque commerciale " +
      "Carlow. Elle a son siège social au " +
      "425 Chemin des Souliers, 07200 VESSEAUX (Ardèche). L'entreprise édite et exploite la " +
      "marketplace B2B carlow.fr, première place de marché européenne spécialisée dans la " +
      "distribution d'équipements pour les énergies renouvelables et les économies d'énergie, " +
      "neufs et de seconde vie."
  ),
  P(
    "Carlow se positionne comme un tiers de confiance sectoriel : la plateforme connecte des " +
      "vendeurs professionnels (fabricants, distributeurs, importateurs) à des acheteurs B2B " +
      "qualifiés (installateurs, bureaux d'études, intégrateurs, exploitants) à travers un parcours " +
      "d'achat et de vente sans couture. Le modèle économique est celui d'une marketplace pure : " +
      "les vendeurs ne paient des frais de commission qu'en cas de vente effective."
  )
);

children.push(H4("1.1.2 Activités et services"));
children.push(
  P(
    "Carlow propose un catalogue spécialisé organisé autour de six grandes catégories d'équipements " +
      "couvrant l'essentiel des besoins en transition énergétique :"
  )
);
children.push(
  BULLET_BOLD(
    "Photovoltaïque : ",
    "modules, onduleurs, rails et systèmes de fixation, monitoring, câblage, visserie."
  ),
  BULLET_BOLD(
    "Pompes à chaleur : ",
    "unités extérieures et intérieures, systèmes split, ballons, gainables."
  ),
  BULLET_BOLD(
    "Biomasse : ",
    "poêles, inserts, chaudières, fourneaux, tubage."
  ),
  BULLET_BOLD(
    "Solaire thermique : ",
    "générateurs, ballons, batteries, éclairage, aérovoltaïque."
  ),
  BULLET_BOLD(
    "Mobilité électrique : ",
    "systèmes IRVE, bornes de recharge, câbles, monitoring et suivi."
  ),
  BULLET_BOLD(
    "Gestion technique du bâtiment (GTB) : ",
    "capteurs, systèmes de pilotage, commandes contrôle, trappes."
  )
);
children.push(
  P(
    "Au-delà du catalogue, Carlow assure pour le compte de ses vendeurs un ensemble complet de " +
      "services BtoB : acquisition d'audience qualifiée, gestion des paiements et de la facturation " +
      "via Stripe, options de transport, gestion des devis, délais de paiement, assurance des " +
      "transactions. Une messagerie tripartite sécurisée (vendeur, acheteur, opérateur) accompagne " +
      "chaque commande, et un tableau de bord intégré permet à chaque vendeur de suivre ses ventes " +
      "et ses indicateurs clés."
  )
);

children.push(H4("1.1.3 Mission et vision"));
children.push(
  P(
    "La mission affichée de Carlow est de digitaliser l'accès aux équipements liés aux énergies " +
      "renouvelables et aux économies d'énergie en proposant un véritable « one-stop-shop BtoB », " +
      "couvrant à la fois le neuf et la seconde vie. Cette dimension circulaire constitue l'une des " +
      "originalités de la plateforme : Carlow propose, pour chaque catégorie, des produits " +
      "reconditionnés issus d'inventaires non écoulés ou de chantiers reconfigurés, contribuant " +
      "ainsi à une meilleure utilisation des ressources et à la réduction de l'empreinte carbone " +
      "du secteur."
  ),
  P(
    "La vision portée par les fondateurs est celle d'un écosystème B2B transparent, dans lequel " +
      "les acheteurs accèdent à une offre profonde accompagnée de services clé en main, et où les " +
      "vendeurs disposent de nouveaux débouchés pour leurs produits neufs et de seconde vie, sans " +
      "frais d'inscription préalable."
  )
);

children.push(H4("1.1.4 Équipe et écosystème"));
children.push(
  P(
    "Carlow est une structure entrepreneuriale à taille humaine. L'équipe interne, qualifiée " +
      "d'« exploitants », est composée des co-fondateurs Paul-Emile DOURS et Romain PORQUET, " +
      "auxquels s'ajoute Damien EYBALIN. Cette équipe restreinte s'appuie sur un écosystème de " +
      "partenaires spécialisés qui couvre l'ensemble de la chaîne de valeur :"
  )
);
children.push(
  BULLET_BOLD(
    "Origami Marketplace : ",
    "fournisseur SaaS qui édite et opère la solution logicielle de back-office sur laquelle " +
      "repose la marketplace carlow.fr. Origami est un éditeur reconnu de plateformes marketplace " +
      "« en marque blanche »."
  ),
  BULLET_BOLD(
    "Novaway : ",
    "agence française de développement web qui assure l'intégration et l'évolution du front-office " +
      "(carlow.fr)."
  ),
  BULLET_BOLD(
    "Geoffrey TRISTRAM : ",
    "expert SEO indépendant qui pilote la stratégie de référencement naturel et la visibilité " +
      "organique de la plateforme."
  ),
  BULLET_BOLD(
    "Stripe : ",
    "prestataire de services de paiement (PSP). Stripe assure la séquestration des fonds, la " +
      "procédure de KYB (Know Your Business) lors de l'onboarding marchand, ainsi que l'administration " +
      "des flux financiers entre acheteurs, vendeurs et plateforme. Certifié PCI DSS, Stripe permet " +
      "l'encaissement multi-devises et propose une protection contre la fraude par authentification " +
      "multifactorielle."
  ),
  BULLET_BOLD(
    "Vendeurs : ",
    "à la date de ce rapport, sept vendeurs sont déjà onboardés sur la plateforme et plusieurs " +
      "centaines de prospects sont identifiés comme cibles prioritaires de l'équipe commerciale."
  )
);

children.push(H4("1.1.5 Déroulement du stage"));
children.push(
  P(
    "Notre stage s'est déroulé du [date de début] au [date de fin], soit une durée de [durée — " +
      "ex. : 4 mois] au sein de Solelh Energie (Carlow). Compte tenu de la nature distribuée de " +
      "l'équipe (siège en Ardèche, partenaires répartis en France), les échanges se sont effectués " +
      "à distance avec des points hebdomadaires structurés. Notre encadrant entreprise, Monsieur " +
      "Paul-Emile DOURS, co-fondateur de Carlow, a défini avec nous le périmètre fonctionnel du " +
      "projet et a assuré le suivi régulier de l'avancement."
  ),
  P(
    "Cette immersion professionnelle dans une structure de type startup nous a permis de mettre " +
      "en application les connaissances théoriques acquises au cours de notre formation, dans un " +
      "contexte où les choix techniques, le périmètre fonctionnel et les priorités évoluent " +
      "rapidement. Elle nous a également amené à développer des compétences solides en architecture " +
      "logicielle moderne, en intégration de services tiers (Stripe, VIES, Resend, Supabase) et " +
      "en sécurité applicative (hachage bcrypt, isolation des fichiers sensibles, gestion des accès " +
      "administrateurs)."
  )
);

// 1.2 Présentation du projet
children.push(H3("1.2 Présentation du projet"));
children.push(H4("1.2.1 Contexte du projet"));
children.push(
  P(
    "La transition énergétique constitue aujourd'hui l'un des défis structurants pour les économies " +
      "européennes. Le marché des équipements liés aux énergies renouvelables croît rapidement, " +
      "porté par les directives européennes (RED III), les plans nationaux d'investissement et la " +
      "demande croissante des entreprises et des collectivités. Cette dynamique se traduit par une " +
      "forte fragmentation de l'offre, partagée entre fabricants asiatiques, distributeurs européens " +
      "et intégrateurs locaux."
  ),
  P(
    "En parallèle, le commerce inter-entreprises se digitalise massivement. Selon l'enquête " +
      "internationale Sana Commerce de 2023, 88 % des entreprises B2B estiment qu'elles réaliseront " +
      "leurs ventes exclusivement en ligne d'ici à 2025, et 66 % des acheteurs B2B privilégient déjà " +
      "l'approvisionnement en ligne. L'expérience client, et particulièrement la qualité de la " +
      "livraison, est devenue le premier critère de décision d'achat (cité par 80 % des acheteurs " +
      "professionnels), devant le prix lui-même (20 %)."
  ),
  P(
    "Dans ce contexte, les acheteurs professionnels du secteur EnR — bureaux d'études, " +
      "installateurs, exploitants et grands comptes — peinent à comparer les fournisseurs, à vérifier " +
      "leur conformité réglementaire (numéros de TVA, certifications CE, agréments PPE2) et à " +
      "structurer leurs achats sur un canal fiable. Symétriquement, les vendeurs spécialisés peinent " +
      "à atteindre une clientèle B2B qualifiée hors de leur marché géographique de proximité. " +
      "C'est cette double friction que Carlow ambitionne de résoudre."
  )
);

children.push(H4("1.2.2 Description du projet"));
children.push(
  P(
    "Le projet confié dans le cadre du stage présente une double dimension, à la fois analytique " +
      "et applicative, en cohérence avec le modèle de jeune startup encore en exploration de son " +
      "modèle économique."
  )
);
children.push(
  PR([
    {
      text: "Volet analytique — Structuration de la prospection BtoB :",
      bold: true,
    },
  ])
);
children.push(
  P(
    "L'un des enjeux centraux pour Carlow est l'acquisition de nouveaux vendeurs. Sept fournisseurs " +
      "sont à ce jour onboardés sur la plateforme, alors que des centaines de prospects européens " +
      "restent à approcher. Le premier volet du stage consiste donc à structurer une démarche de " +
      "prospection BtoB outillée : définition de la méthode, construction d'une base de contacts " +
      "vendeurs européens via les outils dédiés (scraping web, Waalaxy, recherche manuelle " +
      "qualifiée), enrichissement progressif et qualification des leads."
  )
);
children.push(
  PR([
    {
      text: "Volet applicatif — Conception et réalisation d'un portail vendeur :",
      bold: true,
    },
  ])
);
children.push(
  P(
    "En complément de la solution back-office Origami Marketplace utilisée en production, le " +
      "second volet consiste à concevoir et développer un portail web sur mesure dédié à " +
      "l'onboarding des vendeurs et à leur supervision administrative. Cette solution doit permettre " +
      "à Carlow d'industrialiser le recrutement des fournisseurs identifiés lors du volet analytique, " +
      "en automatisant les vérifications réglementaires (TVA intracommunautaire via VIES, " +
      "documents légaux, certifications techniques) et en offrant à l'équipe une interface unifiée " +
      "pour piloter les dossiers, le catalogue produits, les commandes et les notifications."
  )
);
children.push(
  P(
    "Plus précisément, la solution applicative à développer comprend :"
  )
);
children.push(
  BULLET(
    "un parcours d'onboarding guidé en six étapes pour les fournisseurs (compte, société, documents, certifications, logistique, confirmation) ;"
  ),
  BULLET(
    "une intégration native au service VIES de la Commission européenne pour la validation automatique des numéros de TVA intracommunautaires ;"
  ),
  BULLET(
    "un système de dépôt de documents (K-Bis, statuts, pièce d'identité, RIB, certifications CE et Certisolis) avec stockage sécurisé sur Supabase Storage ;"
  ),
  BULLET(
    "un back-office d'administration permettant la validation, le rejet ou la suspension des dossiers vendeurs, ainsi que la gestion centralisée du catalogue, des commandes, des acheteurs et des notifications ;"
  ),
  BULLET(
    "un module d'inscription et d'authentification distinct pour les acheteurs, avec sécurisation des mots de passe par hachage bcrypt à douze tours de salage ;"
  ),
  BULLET(
    "des notifications transactionnelles automatiques (bienvenue, soumission de dossier, activation de compte) via le service Resend."
  )
);

children.push(H4("1.2.3 Objectifs à atteindre"));
children.push(
  P(
    "La solution doit répondre aux objectifs suivants, formulés à partir des entretiens menés avec " +
      "Monsieur Paul-Emile DOURS et avec un échantillon de fournisseurs cibles :"
  )
);
children.push(
  BULLET_BOLD(
    "Industrialiser l'acquisition vendeurs ",
    "en passant d'une approche artisanale à une démarche outillée et reproductible, capable " +
      "de traiter plusieurs centaines de prospects européens identifiés."
  ),
  BULLET_BOLD(
    "Réduire le temps d'inscription d'un vendeur ",
    "à moins de quinze minutes pour la saisie initiale, contre plusieurs heures dans les " +
      "processus traditionnels par échanges d'e-mails et de pièces jointes."
  ),
  BULLET_BOLD(
    "Garantir la conformité réglementaire ",
    "à travers la vérification automatique des numéros de TVA intracommunautaires et la collecte " +
      "structurée des documents obligatoires."
  ),
  BULLET_BOLD(
    "Centraliser la gestion administrative ",
    "des dossiers vendeurs, des produits, des acheteurs, des commandes et des notifications " +
      "dans une interface unifiée et responsive."
  ),
  BULLET_BOLD(
    "Sécuriser les données ",
    "des utilisateurs et des fournisseurs (chiffrement des mots de passe, isolation des fichiers " +
      "sensibles, accès restreint au back-office par cookie httpOnly)."
  ),
  BULLET_BOLD(
    "Offrir une expérience utilisateur fluide ",
    "et homogène, accessible aussi bien sur ordinateur que sur mobile, conforme aux standards " +
      "modernes du Web."
  )
);

// 2. Étude de l'existant
children.push(H2("2. Étude de l'existant"));
children.push(
  P(
    "L'étude de l'existant permet d'analyser les solutions actuellement disponibles sur le marché, " +
      "d'en identifier les forces et les faiblesses, et de prendre en considération ces enseignements " +
      "lors de la conception de notre propre solution. Nous avons sélectionné trois plateformes " +
      "représentatives du paysage actuel des marketplaces dédiées aux énergies renouvelables ou " +
      "au commerce B2B technique."
  )
);

children.push(H3("2.1 Analyse des solutions existantes"));

// 2.1.1
children.push(H4("2.1.1 La plateforme « Alma Solar Shop »"));
children.push(
  P(
    "Alma Solar Shop est l'un des plus importants distributeurs en ligne européens d'équipements " +
      "photovoltaïques. La plateforme propose un large catalogue de panneaux, onduleurs, batteries " +
      "et accessoires, principalement à destination des installateurs et des particuliers."
  )
);
children.push(PR([{ text: "Avantages :", bold: true }]));
children.push(
  BULLET("catalogue très étoffé et bien classé par catégorie d'équipement ;"),
  BULLET("affichage transparent des stocks en temps réel et des délais de livraison ;"),
  BULLET("interface mature, expérience d'achat optimisée pour les commandes répétées.")
);
children.push(PR([{ text: "Inconvénients :", bold: true }]));
children.push(
  BULLET(
    "modèle de distribution centralisé : la plateforme achète et revend les produits, sans logique de marketplace multi-vendeurs ;"
  ),
  BULLET("absence de processus d'onboarding ouvert pour les fournisseurs tiers ;"),
  BULLET(
    "intégration limitée des certifications techniques et de la conformité TVA intracommunautaire ;"
  ),
  BULLET(
    "spécialisation exclusive dans le photovoltaïque, sans couverture transverse des autres équipements EnR (pompes à chaleur, biomasse, IRVE, GTB)."
  )
);

// 2.1.2
children.push(H4("2.1.2 La plateforme « ManoMano Pro »"));
children.push(
  P(
    "ManoMano Pro est la déclinaison professionnelle de la marketplace ManoMano, spécialisée dans " +
      "le bricolage, l'amélioration de l'habitat et l'outillage. Elle propose un onglet dédié aux " +
      "équipements liés à la transition énergétique."
  )
);
children.push(PR([{ text: "Avantages :", bold: true }]));
children.push(
  BULLET("modèle marketplace authentique, avec inscription de vendeurs tiers ;"),
  BULLET("ergonomie soignée, recherche performante et filtres avancés ;"),
  BULLET("disponibilité d'un compte professionnel avec facturation adaptée.")
);
children.push(PR([{ text: "Inconvénients :", bold: true }]));
children.push(
  BULLET(
    "positionnement généraliste : les EnR ne représentent qu'une catégorie parmi des dizaines, sans expertise verticale ;"
  ),
  BULLET(
    "absence d'outils de conformité spécifiques aux équipements EnR (certifications CE détaillées, agréments PPE2, fiches Certisolis) ;"
  ),
  BULLET(
    "processus d'onboarding standard, peu adapté aux exigences documentaires d'un fournisseur EnR ;"
  ),
  BULLET("absence d'offre dédiée aux produits de seconde vie.")
);

// 2.1.3
children.push(H4("2.1.3 La plateforme « Mirakl »"));
children.push(
  P(
    "Mirakl est un éditeur français de logiciels qui fournit une solution SaaS de marketplace " +
      "« en marque blanche » à de grandes enseignes (Auchan, Decathlon, Leroy Merlin, etc.). " +
      "Bien qu'il ne s'agisse pas d'une marketplace finale destinée aux acheteurs, son positionnement " +
      "est pertinent pour notre étude car il définit le standard technique du marché et constitue " +
      "un concurrent direct du fournisseur SaaS Origami Marketplace utilisé par Carlow."
  )
);
children.push(PR([{ text: "Avantages :", bold: true }]));
children.push(
  BULLET("architecture mature et éprouvée, conçue pour gérer des milliers de vendeurs ;"),
  BULLET(
    "écosystème complet de modules (paiement, logistique, gestion des litiges) ;"
  ),
  BULLET("conformité européenne robuste.")
);
children.push(PR([{ text: "Inconvénients :", bold: true }]));
children.push(
  BULLET(
    "solution générique non spécialisée dans les EnR : la verticalisation et les workflows métier doivent être entièrement reconstruits par chaque client ;"
  ),
  BULLET(
    "coûts de licence et d'intégration élevés, peu adaptés à un acteur émergent ;"
  ),
  BULLET(
    "expérience d'onboarding standard qui ne couvre pas la spécificité des certifications techniques EnR (Certisolis, PPE2, agréments Qualit'EnR) ;"
  ),
  BULLET("absence native de gestion du circuit second-life (produits reconditionnés).")
);

// 2.2 Synthèse comparative
children.push(H3("2.2 Synthèse comparative"));
children.push(
  P(
    "Le tableau ci-dessous récapitule, pour chacune des solutions étudiées, le degré de couverture " +
      "des fonctionnalités attendues d'une marketplace B2B EnR moderne, mises en regard du " +
      "positionnement cible de Carlow."
  )
);

const HC = (text) => TC(text, { shading: "F4F0EA", bold: true, width: 1872 });

const tableSynth = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1872, 1872, 1872, 1872, 1872],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        HC("Critère"),
        HC("Alma Solar"),
        HC("ManoMano Pro"),
        HC("Mirakl"),
        HC("Carlow (cible)"),
      ],
    }),
    new TableRow({
      children: [
        TC("Modèle marketplace multi-vendeurs", { width: 1872 }),
        TC("Non", { width: 1872, align: AlignmentType.CENTER }),
        TC("Oui", { width: 1872, align: AlignmentType.CENTER }),
        TC("Oui (SaaS)", { width: 1872, align: AlignmentType.CENTER }),
        TC("Oui", {
          width: 1872,
          align: AlignmentType.CENTER,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new TableRow({
      children: [
        TC("Spécialisation EnR verticale", { width: 1872 }),
        TC("Partielle (PV)", { width: 1872, align: AlignmentType.CENTER }),
        TC("Faible", { width: 1872, align: AlignmentType.CENTER }),
        TC("Aucune", { width: 1872, align: AlignmentType.CENTER }),
        TC("Totale (6 cat.)", {
          width: 1872,
          align: AlignmentType.CENTER,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new TableRow({
      children: [
        TC("Offre seconde vie / circulaire", { width: 1872 }),
        TC("Non", { width: 1872, align: AlignmentType.CENTER }),
        TC("Non", { width: 1872, align: AlignmentType.CENTER }),
        TC("Non native", { width: 1872, align: AlignmentType.CENTER }),
        TC("Native", {
          width: 1872,
          align: AlignmentType.CENTER,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new TableRow({
      children: [
        TC("Vérification VIES de la TVA", { width: 1872 }),
        TC("Non", { width: 1872, align: AlignmentType.CENTER }),
        TC("Manuelle", { width: 1872, align: AlignmentType.CENTER }),
        TC("Optionnelle", { width: 1872, align: AlignmentType.CENTER }),
        TC("Automatique", {
          width: 1872,
          align: AlignmentType.CENTER,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new TableRow({
      children: [
        TC("Certifications CE / Certisolis", { width: 1872 }),
        TC("Non", { width: 1872, align: AlignmentType.CENTER }),
        TC("Non", { width: 1872, align: AlignmentType.CENTER }),
        TC("Non", { width: 1872, align: AlignmentType.CENTER }),
        TC("Native", {
          width: 1872,
          align: AlignmentType.CENTER,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new TableRow({
      children: [
        TC("Onboarding vendeur guidé", { width: 1872 }),
        TC("N/A", { width: 1872, align: AlignmentType.CENTER }),
        TC("Standard", { width: 1872, align: AlignmentType.CENTER }),
        TC("Configurable", { width: 1872, align: AlignmentType.CENTER }),
        TC("6 étapes guidées", {
          width: 1872,
          align: AlignmentType.CENTER,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new TableRow({
      children: [
        TC("Logistique & incoterms paramétrables", { width: 1872 }),
        TC("Standard", { width: 1872, align: AlignmentType.CENTER }),
        TC("Limitée", { width: 1872, align: AlignmentType.CENTER }),
        TC("Module séparé", { width: 1872, align: AlignmentType.CENTER }),
        TC("Intégrée", {
          width: 1872,
          align: AlignmentType.CENTER,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new TableRow({
      children: [
        TC("Modèle « pay only if sale »", { width: 1872 }),
        TC("Non (revente)", { width: 1872, align: AlignmentType.CENTER }),
        TC("Commission", { width: 1872, align: AlignmentType.CENTER }),
        TC("Licence + commission", { width: 1872, align: AlignmentType.CENTER }),
        TC("Commission only", {
          width: 1872,
          align: AlignmentType.CENTER,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
  ],
});
children.push(tableSynth);
children.push(
  CAPTION("Tableau 1 : Comparaison des solutions existantes face au positionnement cible de Carlow")
);

// 2.3 Problématique
children.push(H3("2.3 Problématique"));
children.push(
  P(
    "L'analyse comparative met en évidence un vide concurrentiel sur le segment des marketplaces " +
      "B2B verticales spécialisées dans les énergies renouvelables. Les acteurs existants se " +
      "répartissent en trois grandes familles : les distributeurs centralisés sans logique " +
      "multi-vendeurs, les marketplaces généralistes peu spécialisées et les éditeurs de logiciels " +
      "SaaS qui fournissent une infrastructure générique. Aucun ne combine simultanément la " +
      "verticalisation métier, la couverture du circuit second-life, la vérification réglementaire " +
      "automatisée et un onboarding fluide à l'échelle européenne."
  ),
  P(
    "Côté opérationnel, l'équipe Carlow fait face à un défi d'industrialisation : sept vendeurs " +
      "onboardés à ce jour, plusieurs centaines de prospects à traiter, et une approche commerciale " +
      "encore largement artisanale. La problématique centrale de notre projet peut donc se formuler ainsi :"
  )
);
children.push(
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 240 },
    indent: { left: 720, right: 720 },
    border: {
      left: {
        style: BorderStyle.SINGLE,
        size: 18,
        color: COLOR_PRIMARY,
        space: 12,
      },
    },
    children: [
      new TextRun({
        text:
          "Comment structurer l'acquisition de vendeurs européens d'équipements EnR et concevoir " +
          "le portail d'onboarding qui les accompagne, de manière à industrialiser le recrutement, à " +
          "garantir la conformité réglementaire (TVA intracommunautaire, certifications) et à offrir " +
          "à l'équipe Carlow comme aux fournisseurs une expérience fluide, sécurisée et homogène ?",
        font: FONT,
        size: SZ_BODY,
        italics: true,
        color: COLOR_FG,
      }),
    ],
  })
);

// 3. Solution proposée
children.push(H2("3. Solution proposée"));
children.push(
  P(
    "Au regard des limites identifiées et de la problématique formulée, nous proposons de concevoir " +
      "et de développer une plateforme web complète, structurée autour de trois espaces fonctionnels " +
      "distincts mais cohérents, qui complète la solution back-office Origami Marketplace utilisée " +
      "en production :"
  )
);
children.push(
  BULLET_BOLD(
    "un portail vendeur ",
    "permettant à tout fournisseur professionnel de créer son compte, de soumettre l'ensemble " +
      "de son dossier réglementaire (informations société, documents légaux, certifications " +
      "techniques, paramètres logistiques) à travers un parcours guidé en six étapes, et de suivre " +
      "en temps réel l'état de validation de son dossier ;"
  ),
  BULLET_BOLD(
    "un espace acheteur ",
    "offrant la création d'un compte sécurisé, la consultation et la modification du profil et " +
      "le suivi des commandes ;"
  ),
  BULLET_BOLD(
    "un back-office d'administration ",
    "permettant à l'équipe Carlow de superviser l'ensemble des dossiers vendeurs, des documents " +
      "déposés, du catalogue produits, des commandes et des notifications, depuis une interface " +
      "unifiée et entièrement responsive."
  )
);
children.push(
  P(
    "Cette solution apporte plusieurs valeurs ajoutées par rapport aux solutions existantes :"
  )
);
children.push(
  BULLET(
    "la vérification automatique du numéro de TVA intracommunautaire via le service VIES de la Commission européenne, intégrée nativement au parcours d'inscription ;"
  ),
  BULLET(
    "la gestion structurée des certifications spécifiques aux EnR (CE, Certisolis, PPE2) avec dépôt sécurisé sur Supabase Storage ;"
  ),
  BULLET(
    "l'auto-création d'un catalogue par défaut lors de l'activation d'un vendeur, ce qui supprime le délai séparant la validation administrative de la mise en ligne effective des produits ;"
  ),
  BULLET(
    "le hachage des mots de passe via bcrypt avec un coût de douze tours de salage, garantissant la résistance aux attaques par force brute ;"
  ),
  BULLET(
    "une interface d'administration dotée d'une navigation latérale enrichie de badges en temps réel (vendeurs en attente, commandes en cours, notifications non lues), entièrement utilisable sur mobile via un menu coulissant."
  )
);

// 4. Étude des besoins
children.push(H2("4. Étude des besoins"));
children.push(
  P(
    "Toute réussite de projet passe par une analyse rigoureuse des besoins. Cette section précise " +
      "les besoins fonctionnels, c'est-à-dire ce que le système doit faire, ainsi que les besoins " +
      "non fonctionnels, qui décrivent la qualité avec laquelle ces fonctionnalités doivent être " +
      "délivrées."
  )
);

children.push(H3("4.1 Besoins fonctionnels"));
children.push(
  P(
    "Les besoins fonctionnels sont organisés selon les trois acteurs principaux identifiés : " +
      "le vendeur, l'acheteur et l'administrateur."
  )
);

children.push(H4("Pour le vendeur"));
children.push(
  BULLET("créer un compte vendeur avec adresse électronique professionnelle et mot de passe sécurisé ;"),
  BULLET("renseigner les informations légales de sa société (raison sociale, SIRET, forme juridique, adresse) ;"),
  BULLET("saisir son numéro de TVA et déclencher sa validation automatique via le service VIES ;"),
  BULLET("déposer ses documents légaux obligatoires : extrait K-Bis, statuts de société, pièce d'identité du dirigeant, relevé d'identité bancaire ;"),
  BULLET("ajouter ses certifications techniques par catégorie (photovoltaïque, pompes à chaleur, biomasse, mobilité IRVE, solaire thermique, gestion technique du bâtiment) ;"),
  BULLET("paramétrer ses informations logistiques : adresse d'expédition, délai de préparation, poids maximal par palette, incoterm par défaut, matrice de transport ;"),
  BULLET("soumettre son dossier complet à la validation de l'administration ;"),
  BULLET("consulter à tout moment l'état d'avancement de son onboarding et l'état de son compte (en attente, soumis, actif, rejeté).")
);

children.push(H4("Pour l'acheteur"));
children.push(
  BULLET("créer un compte acheteur avec mot de passe sécurisé ;"),
  BULLET("renseigner ses coordonnées (téléphone, adresse de livraison) ;"),
  BULLET("se connecter et accéder à son espace personnel ;"),
  BULLET("modifier les informations de son profil ;"),
  BULLET("consulter l'historique de ses commandes ;"),
  BULLET("se déconnecter de manière sûre.")
);

children.push(H4("Pour l'administrateur"));
children.push(
  BULLET("se connecter au back-office via un mot de passe protégé ;"),
  BULLET("consulter un tableau de bord présentant les statistiques globales de la plateforme ;"),
  BULLET("gérer les vendeurs : valider, rejeter, suspendre, supprimer ;"),
  BULLET("consulter les acheteurs et leur nombre de commandes ;"),
  BULLET("gérer le catalogue produits : créer, modifier, activer ou désactiver, supprimer un produit ;"),
  BULLET("gérer les catalogues vendeurs et la galerie photos associée ;"),
  BULLET("consulter et faire évoluer le statut des commandes (en cours, livrée, annulée) ;"),
  BULLET("consulter et supprimer les notifications ;"),
  BULLET("paramétrer son compte administrateur.")
);

children.push(H3("4.2 Besoins non fonctionnels"));
children.push(
  P(
    "Les besoins non fonctionnels caractérisent la qualité du système et son comportement attendu, " +
      "indépendamment des fonctionnalités proprement dites."
  )
);
children.push(
  BULLET_BOLD(
    "Sécurité : ",
    "les mots de passe sont systématiquement hachés via bcrypt (douze tours de salage) ; les " +
      "documents sont stockés dans des espaces privés sur Supabase Storage avec génération " +
      "d'URL signées à durée de vie limitée ; l'accès au back-office est protégé par un cookie " +
      "httpOnly et un secret côté serveur."
  ),
  BULLET_BOLD(
    "Fiabilité : ",
    "le système doit assurer un taux de disponibilité élevé en s'appuyant sur l'infrastructure " +
      "serverless de Vercel et sur la base de données PostgreSQL managée, afin de garantir une " +
      "expérience utilisateur stable."
  ),
  BULLET_BOLD(
    "Ergonomie : ",
    "l'interface doit être intuitive et conforme aux standards modernes du Web, avec une charte " +
      "graphique cohérente avec celle du site carlow.fr, des composants réutilisables et un " +
      "parcours d'onboarding lisible."
  ),
  BULLET_BOLD(
    "Conception responsive : ",
    "l'application doit s'adapter à tous les terminaux (ordinateur, tablette, smartphone), y " +
      "compris pour le back-office d'administration qui propose un menu latéral coulissant sur mobile."
  ),
  BULLET_BOLD(
    "Maintenabilité : ",
    "le code est organisé en composants réutilisables, typé statiquement avec TypeScript et " +
      "vérifié à chaque modification, ce qui facilite l'évolutivité du système et l'intégration " +
      "future de nouvelles fonctionnalités (paiements Stripe Connect, multi-langues, application mobile)."
  ),
  BULLET_BOLD(
    "Performance : ",
    "les pages publiques doivent être servies en moins de deux secondes ; les opérations sensibles " +
      "(hachage des mots de passe, validation VIES) sont exécutées côté serveur en mode asynchrone."
  ),
  BULLET_BOLD(
    "Conformité réglementaire : ",
    "la plateforme respecte le Règlement général sur la protection des données (RGPD) en limitant " +
      "la collecte aux seules informations nécessaires à la finalité commerciale, et permet la " +
      "suppression d'un compte avec effacement en cascade des documents associés."
  )
);

// 5. Méthodologie
children.push(H2("5. Méthodologie de travail"));
children.push(
  P(
    "Pour mener à bien ce projet, nous avons retenu une méthodologie agile incrémentale, articulée " +
      "autour de cycles courts (de l'ordre de la semaine) suivant le schéma classique « concevoir, " +
      "développer, valider, itérer ». Cette approche se justifie par la nature évolutive du projet, " +
      "par la culture startup de Carlow et par la nécessité de pouvoir intégrer rapidement les " +
      "retours de notre encadrant entreprise."
  ),
  P("Chaque cycle comprend les phases suivantes :")
);
children.push(
  BULLET_BOLD(
    "Planification : ",
    "définition des objectifs du cycle, priorisation des tâches et estimation des ressources nécessaires."
  ),
  BULLET_BOLD(
    "Conception : ",
    "modélisation des cas d'utilisation, conception des écrans et des interactions, préparation des schémas de données."
  ),
  BULLET_BOLD(
    "Développement : ",
    "implémentation des fonctionnalités prévues en suivant les bonnes pratiques d'architecture (composants réutilisables, séparation des responsabilités, typage statique)."
  ),
  BULLET_BOLD(
    "Validation : ",
    "vérification systématique du type-check, tests fonctionnels manuels, revue par l'encadrant entreprise et déploiement en environnement de pré-production sur Vercel pour validation finale."
  ),
  BULLET_BOLD(
    "Rétrospective : ",
    "identification des points d'amélioration, ajustement du backlog et planification du cycle suivant."
  )
);
children.push(
  P(
    "Cette méthodologie s'est appuyée sur des outils de pilotage adaptés (gestion de version Git, " +
      "intégration et déploiement continus via Vercel, communication asynchrone avec l'équipe Carlow) " +
      "et a permis de maintenir une cadence de livraison régulière tout au long de la période de stage."
  )
);

// Conclusion
children.push(H2("Conclusion"));
children.push(
  P(
    "Ce premier chapitre a permis de poser le cadre général du projet en présentant l'organisme " +
      "d'accueil — Solelh Energie, qui exploite la marketplace B2B Carlow — son écosystème de " +
      "partenaires (Origami Marketplace, Novaway, Geoffrey Tristram, Stripe) et ses ambitions sur " +
      "le marché européen des équipements EnR. L'analyse de l'existant a fait apparaître un vide " +
      "concurrentiel sur le segment des marketplaces B2B verticales spécialisées dans les énergies " +
      "renouvelables, en particulier sur le circuit second-life et sur la conformité réglementaire " +
      "automatisée. Ce constat justifie pleinement la pertinence de notre solution."
  ),
  P(
    "Nous avons ensuite formulé la problématique centrale, exposé la solution proposée et détaillé " +
      "l'ensemble des besoins fonctionnels et non fonctionnels qui guideront la phase de conception " +
      "et de réalisation. Le chapitre suivant sera consacré à l'étude conceptuelle. Nous y présenterons " +
      "en particulier le langage de modélisation retenu, les diagrammes de cas d'utilisation, les " +
      "diagrammes de séquence et le diagramme de classes, qui formaliseront la conception du système " +
      "avant d'en aborder la réalisation."
  )
);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTRUCTION DU DOCUMENT
// ─────────────────────────────────────────────────────────────────────────────

const doc = new Document({
  creator: "Claude",
  title: "Rapport PFE Carlow — Chapitre 1 : Étude préalable",
  description:
    "Industrialisation de l'acquisition vendeurs et conception d'un portail d'onboarding pour la marketplace B2B Carlow (Solelh Energie)",
  styles: {
    default: { document: { run: { font: FONT, size: SZ_BODY } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: SZ_H1, bold: true, font: FONT, color: COLOR_PRIMARY },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: SZ_H2, bold: true, font: FONT, color: COLOR_FG },
        paragraph: { spacing: { before: 320, after: 180 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: SZ_H3, bold: true, font: FONT, color: COLOR_FG },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: "◦",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
        // Active la distinction "première page / autres pages" pour que la
        // page de garde n'ait ni en-tête ni numéro de page.
        titlePage: true,
      },
      headers: {
        // Page de garde : en-tête vide
        first: new Header({
          children: [new Paragraph({ children: [] })],
        }),
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: {
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 6,
                  color: COLOR_PRIMARY,
                  space: 6,
                },
              },
              children: [
                new TextRun({
                  text: "Chapitre 1 — Étude préalable",
                  font: FONT,
                  size: SZ_SMALL,
                  italics: true,
                  color: COLOR_MUTED,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "— ",
                  font: FONT,
                  size: SZ_SMALL,
                  color: COLOR_MUTED,
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: FONT,
                  size: SZ_SMALL,
                  color: COLOR_MUTED,
                }),
                new TextRun({
                  text: " —",
                  font: FONT,
                  size: SZ_SMALL,
                  color: COLOR_MUTED,
                }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

const outputPath = path.resolve(
  __dirname,
  "../rapport de stage/Rapport_PFE_Carlow_Chapitre1.docx"
);

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log("OK ->", outputPath);
});
