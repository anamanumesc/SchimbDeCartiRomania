# schimb-de-carti-romania

## frontend setup
```
1. cd frontend
2. cd schimb-de-carti-romania
3. node -v
4. npm -v
5. npm install -g @vue/cli
6. npm install
7. npm install axios
8. npm run serve



## backend setup 
1. cd backend (in alt terminal)
2. npm install express cors mssql dotenv
3. trebuie sa adaugi in baza de date adresa ta IP 
4. node server.js




8. go to http://localhost:8080/ 



                                      ┌───────────────┐
                                      │   /login      │ ←─ Autentificare utilizator
                                      └──────┬────────┘
                                             │
                                      ┌──────▼────────┐
                                      │   /signup     │ ←─ Creare cont nou
                                      └──────┬────────┘
                                             │
                                      ┌──────▼────────┐
                                      │ /forgot-password │ ←─ Resetare parolă
                                             │
                                             ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │                                / (HomePage)                            │
    │ - Listă de cărți disponibile pentru schimb                            │
    │ - Posibil filtrare după oraș/categorie                               │
    └──────┬────────────────────────────────────────────────────────────────┘
           │
           │
    ┌──────▼───────────────────────────────────────────────────────────────┐
    │ /book/:id (BookPage)                                                 │
    │ - Pagina detaliată a unei cărți                                      │
    │ - Buton de propunere schimb                                          │
    └──────┬───────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ /book/:id/propose (ProposeExchangePage)                              │
    │ - Form pentru a propune un schimb cu cartea respectivă              │
    └──────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────────┐
    │ /add (AddBookPage)                                                   │
    │ - Form pentru a adăuga o carte în platformă                         │
    └──────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────────┐
    │ /account (AccountPage)                                               │
    │ - Profilul propriu: informații personale, cărțile mele etc.         │
    └──────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────────┐
    │ /requests (MyRequestsPage)                                           │
    │ - Listă de cereri de schimb trimise și primite                      │
    └──────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────────┐
    │ /profile/:id (PublicProfilePage)                                     │
    │ - Profil public al altui utilizator                                 │
    │ - Afișează cărțile acestuia și info publice                          │
    └──────────────────────────────────────────────────────────────────────┘

