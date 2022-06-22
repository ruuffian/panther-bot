-- CREATE TYPE POSITION AS ENUM ('TOP', 'JUNG', 'MID', 'ADC', 'SUP');

CREATE TABLE "teams" (
  "teamid" CHAR(37),
  "captain" VARCHAR(255) NOT NULL,
  "wins" SMALLINT DEFAULT 0,
  "losses" SMALLINT DEFAULT 0,
  PRIMARY KEY(teamid)
);

CREATE TABLE "users" (
  "userid" CHAR(37),
  "teamid" CHAR(37),
  "starter" BOOLEAN NOT NULL,
  "position" varchar(5) NOT NULL,
  PRIMARY KEY(userid),
  CONSTRAINT fk_teamid
    FOREIGN KEY(teamid)
      REFERENCES teams(teamid)
      ON DELETE SET NULL
);

CREATE TABLE "userlookup" (
  "userid" CHAR(37),
  "username" VARCHAR(255) NOT NULL,
  CONSTRAINT fk_userid
    FOREIGN KEY(userid)
      REFERENCES users(userid)
      ON DELETE CASCADE
);

CREATE TABLE "teamlookup" (
  "teamid" CHAR(37),
  "teamname" VARCHAR(255) NOT NULL,
  CONSTRAINT fk_teamid
    FOREIGN KEY(teamid)
      REFERENCES teams(teamid)
      ON DELETE CASCADE
);

CREATE TABLE "riot_info" (
  "userid" CHAR(37),
  "puuid" VARCHAR(78),
  "accountid" VARCHAR(56),
  "profileicon" INTEGER,
  "summonerlevel" SMALLINT,
  "revisionDate" INTEGER,
  CONSTRAINT fk_userid
    FOREIGN KEY(userid)
      REFERENCES users(userid)
      ON DELETE CASCADE
);
