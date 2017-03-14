CREATE TABLE uzytkownicy (
	uz_id       serial NOT NULL,
	uz_login    varchar(254) NOT NULL,
	uz_haslo    varchar(254) NOT NULL,
	uz_email    varchar(254) NOT NULL,
	PRIMARY KEY (uz_id)
);
CREATE UNIQUE INDEX uzytkownicy_idx_001 ON uzytkownicy(uz_email);
CREATE UNIQUE INDEX uzytkownicy_idx_002 ON uzytkownicy(uz_login);

CREATE TABLE kontakty (
	ko_id          serial NOT NULL,
	ko_uz_id_start integer REFERENCES uzytkownicy, -- kto zainicjował kontakt
	ko_uz_id_od    integer REFERENCES uzytkownicy, -- pierwszy użytkownik
	ko_uz_id_do    integer REFERENCES uzytkownicy, -- drugi użytkownik
	ko_status      integer, -- status kontaktu
	                        -- -1 = usunięty
	                        --  1 = aktywny
	                        --  2 = oczekujący
	PRIMARY KEY (ko_id)
);
CREATE INDEX kontakty_idx_001 ON kontakty(ko_uz_id_od);
CREATE INDEX kontakty_idx_002 ON kontakty(ko_uz_id_do);
