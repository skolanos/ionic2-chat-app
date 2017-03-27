CREATE TABLE uzytkownicy (
	uz_id       serial NOT NULL,
	uz_login    varchar(254) NOT NULL,
	uz_haslo    varchar(254) NOT NULL,
	uz_email    varchar(254) NOT NULL,
	PRIMARY KEY (uz_id)
);
CREATE UNIQUE INDEX uzytkownicy_idx_001 ON uzytkownicy(uz_email);
CREATE UNIQUE INDEX uzytkownicy_idx_002 ON uzytkownicy(uz_login);

CREATE TABLE kontakty_statusy (
	ks_id    serial NOT NULL,
	ks_nazwa varchar(35),
	PRIMARY KEY (ks_id)
);

CREATE TABLE kontakty (
	ko_id          serial NOT NULL,
	ko_uz_id_start integer REFERENCES uzytkownicy, -- kto zainicjował kontakt
	ko_uz_id_od    integer REFERENCES uzytkownicy, -- pierwszy użytkownik
	ko_uz_id_do    integer REFERENCES uzytkownicy, -- drugi użytkownik
	ko_ks_id       integer REFERENCES kontakty_statusy,
	PRIMARY KEY (ko_id)
);
CREATE INDEX kontakty_idx_001 ON kontakty(ko_uz_id_start);
CREATE INDEX kontakty_idx_002 ON kontakty(ko_uz_id_od);
CREATE INDEX kontakty_idx_003 ON kontakty(ko_uz_id_do);
CREATE INDEX kontakty_idx_004 ON kontakty(ko_ks_id);

CREATE TABLE wiadomosci_typy (
	wt_id    serial NOT NULL,
	wt_nazwa varchar(35), -- typ wiadomości
	PRIMARY KEY (wt_id)
);

CREATE TABLE wiadomosci (
	wi_id       serial NOT NULL,
	wi_data     timestamp DEFAULT current_timestamp,
	wi_wt_id    integer REFERENCES wiadomosci_typy,
	wi_uz_id_od integer REFERENCES uzytkownicy, -- kto wysłał wiadomość
	wi_uz_id_do integer REFERENCES uzytkownicy, -- do kogo wysłano wiadomość
	wi_tresc    text,
	PRIMARY KEY (wi_id)
);
CREATE INDEX wiadomosci_idx_001 ON wiadomosci(wi_uz_id_od);
CREATE INDEX wiadomosci_idx_002 ON wiadomosci(wi_uz_id_do);
CREATE INDEX wiadomosci_idx_003 ON wiadomosci(wi_wt_id);

INSERT INTO kontakty_statusy (ks_id, ks_nazwa) VALUES (-1, 'usunięty');
INSERT INTO kontakty_statusy (ks_id, ks_nazwa) VALUES ( 1, 'aktywny');
INSERT INTO kontakty_statusy (ks_id, ks_nazwa) VALUES ( 2, 'oczekujący');
INSERT INTO wiadomosci_typy (wt_id, wt_nazwa) VALUES (1, 'private-message');
