DROP TABLE IF EXISTS legacy_scores;
ALTER TABLE scores RENAME TO legacy_scores;
CREATE TABLE IF NOT EXISTS scores(
    name TEXT PRIMARY KEY,
    flags INTEGER,
    dmnr REAL,
    pers REAL,
    judg REAL,
    polt REAL,
    real REAL,
    perc REAL,
    horn REAL
);
INSERT INTO scores(
    name, 
    dmnr, 
    pers, 
    judg, 
    polt, 
    real, 
    perc, 
    horn
) SELECT name, 
    dmnr,
    pers,
    judg,
    polt,
    real,
    perc,
    horn
FROM legacy_scores;
UPDATE scores SET flags=0;
DROP TABLE legacy_scores;