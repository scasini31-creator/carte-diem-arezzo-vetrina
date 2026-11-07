# Messa in produzione e sicurezza

## Stato

Il frontend è stato rafforzato, ma **NON è certificato sicuro** finché non si verificano le policy RLS effettive, le ACL Storage e gli account amministrativi del progetto Supabase reale.

## Passaggi obbligatori

1. Effettuare un backup verificato delle tabelle e degli oggetti Storage, e testare un ripristino in un progetto separato.
2. Controllare con `security-audit-readonly.sql` i permessi esistenti, usando un account proprietario. Controllare che `is_admin()` non si basi su `user_metadata` modificabili dall'utente.
3. In Supabase Auth disabilitare registrazioni pubbliche se non necessarie, verificare MFA per gli admin, URL di redirect, durata sessioni, account attivi e misure anti brute-force.
4. Applicare **solo dopo revisione** la migrazione `security-rls-template.sql`: la migrazione richiede una tabella amministratori popolata dal proprietario, altrimenti gli admin vengono esclusi. Adattare allo schema reale prima di eseguirla.
5. Provare, su database di staging popolato con dati di test: utente anonimo, utente autenticato non admin, admin. Verificare SELECT solo sulle informazioni pubbliche; INSERT/UPDATE/DELETE negati agli altri; upload/delete Storage negati agli altri.
6. Pubblicare l'archivio corretto su GitHub Pages. GitHub Pages non permette di impostare header HTTP personalizzati (CSP, HSTS, ecc.) sul dominio github.io: valutare un reverse proxy/CDN per header rigorosi.
7. Attivare monitoraggio e ripristino dati, revisione account e audit log periodici. Aggiornare e fissare le dipendenze esterne a versioni esatte con SRI o vendorizzarle dopo test di compatibilità.

## Limiti noti

Le policy lato database non sono fornite dal progetto originale. Le modifiche qui non cambiano il database online. Le immagini caricate e la funzione di pubblicazione grafica devono essere controllate anche lato database. Nessuna revisione statica può garantire rischio zero o protezione da un account admin compromesso.
