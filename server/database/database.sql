CREATE TABLE uzytkownicy (
	uz_id       serial NOT NULL,
	uz_login    varchar(254) NOT NULL,
	uz_haslo    varchar(254) NOT NULL,
	uz_email    varchar(254) NOT NULL,
	PRIMARY KEY (uz_id)
);
CREATE UNIQUE INDEX uzytkownicy_idx_001 ON uzytkownicy(uz_email);
CREATE UNIQUE INDEX uzytkownicy_idx_002 ON uzytkownicy(uz_login);
