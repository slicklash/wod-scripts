export const Quests = {
  IngenuityTest: "Ingenuity Test",
  Passingtime: "Passingtime",
  RescuingFatherWuel: "Rescuing Father Wuel",
};

export type AdventureContext = {
  idHero: string;
  world: string;
  adventure: string;
  place: string;
  texts: string[]; // raw HTML strings, not HTMLElements
  text: string; // joined innerHTML for matching
  isQuest?: boolean;
};

export type QuestPlaceOptionsMap = {
  [place: string]: QuestPlaceOptions;
};

export type QuestPlaceOptions = {
  pickSingle?: string[];
  pickSingleTransform?: (x: string) => string;
  collect?: ActionEvent[];
  use?: ActionEvent[];
  do?: ActionEvent[];
  reset?: string;
};

export type ActionEvent = {
  match: string;
  found?: string[];
  picked?: string[];
  done?: string[];
};

export type HighlightPlaceMap = Record<string, string[]>;
