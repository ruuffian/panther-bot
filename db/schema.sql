
CREATE TABLE "teams"
(
    "teamid"  CHAR(37),
    "captain" VARCHAR(255) NOT NULL,
    "wins"    SMALLINT DEFAULT 0,
    "losses"  SMALLINT DEFAULT 0,
    PRIMARY KEY (teamid)
);

CREATE TABLE "users"
(
    "userid"   CHAR(37),
    "teamid"   CHAR(37),
    "starter"  BOOLEAN    NOT NULL,
    "position" varchar(5) NOT NULL,
    PRIMARY KEY (userid),
    CONSTRAINT fk_teamid
        FOREIGN KEY (teamid)
            REFERENCES teams (teamid)
            ON DELETE CASCADE
);

CREATE TABLE "map_userid_username"
(
    "key"      SERIAL,
    "userid"   CHAR(37),
    "username" VARCHAR(255) NOT NULL,
    PRIMARY KEY (key),
    CONSTRAINT fk_userid
        FOREIGN KEY (userid)
            REFERENCES users (userid)
            ON DELETE CASCADE
);

CREATE TABLE "map_teamid_teamname"
(
    "key"      SERIAL,
    "teamid"   CHAR(37),
    "teamname" VARCHAR(255) NOT NULL,
    PRIMARY KEY (key),
    CONSTRAINT fk_teamid
        FOREIGN KEY (teamid)
            REFERENCES teams (teamid)
            ON DELETE CASCADE
);