-- CREATE TYPE POSITION AS ENUM ('TOP', 'JUNG', 'MID', 'ADC', 'SUP');

CREATE TABLE "users" (
  "userid" CHAR(37) PRIMARY KEY NOT NULL,
  "teamid" CHAR(37) NOT NULL,
  "starter" BOOLEAN,
  "position" varchar(5)
);

CREATE TABLE "teams" (
  "teamid" CHAR(37) PRIMARY KEY NOT NULL,
  "captain" VARCHAR(255) NOT NULL,
  "wins" SMALLINT DEFAULT 0,
  "losses" SMALLINT DEFAULT 0
);

CREATE TABLE "userlookup" (
  "userid" CHAR(37) NOT NULL,
  "username" VARCHAR(255) NOT NULL
);

CREATE TABLE "teamlookup" (
  "teamid" CHAR(37) NOT NULL,
  "teamname" VARCHAR(255) NOT NULL
);

CREATE TABLE "riot_info" (
  "userid" CHAR(37) NOT NULL,
  "puuid" VARCHAR(78),
  "accountid" VARCHAR(56),
  "profileicon" INTEGER,
  "summonerlevel" SMALLINT,
  "revisionDate" INTEGER
);

ALTER TABLE "userlookup" ADD FOREIGN KEY ("userid") REFERENCES "users" ("userid");

ALTER TABLE "teamlookup" ADD FOREIGN KEY ("teamid") REFERENCES "teams" ("teamid");

ALTER TABLE "riot_info" ADD FOREIGN KEY ("userid") REFERENCES "users" ("userid");

ALTER TABLE "users" ADD FOREIGN KEY ("teamid") REFERENCES "teams" ("teamid");
