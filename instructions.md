Agis en tant qu'architecte et développeur web senior. Je souhaite réaliser un petit projet web fonctionnel, propre et esthétique. Je suis moi-même un développeur très expérimenté (30 ans d'expérience, principalement en C++ et systèmes embarqués, et grand adepte du principe YAGNI), mais j'ai besoin de tes compétences pour la stack web moderne.

**Le projet :** 
Un site pour retrouver et identifier les noms d'anciens camarades de classe d'il y a plus de 30 ans. Je vais envoyer le lien du site à quelques anciens contacts pour qu'ils m'aident à compléter les noms manquants.

**Ressources disponibles dans mon répertoire local :**
Je dispose de 4 photos de classe au format PNG :

- `TerminalC.png`
- `1S2.png`
- `2B.png`
- `3A.png`

**Fonctionnalités et Interface utilisateur (UI) attendues :**
1. **Navigation :** Un système simple (comme des onglets) permettant de basculer entre les 4 classes.
2. **Identification visuelle :** Pour garder la photo propre, je veux un système de numérotation. Des numéros (1, 2, 3...) doivent être superposés sur les personnes de la photo. 
3. **Saisie des noms :** À côté (ou en dessous, selon la taille de l'écran) de la photo, il y aura un panneau contenant une liste numérotée correspondant aux numéros sur l'image, avec des champs de saisie (Nom / Prénom) pour chaque numéro.
4. **Design :** Le rendu doit être moderne, responsive et agréable à regarder (utilise Tailwind CSS via CDN ou du CSS natif bien structuré).

**Architecture et Contraintes techniques :**
1. **Hébergement :** Le site sera hébergé sur mon espace GitHub (GitHub Pages) en tant que site statique.
2. **Sauvegarde des données :** Je souhaite que les données saisies par mes amis soient envoyées et stockées dans un fichier **Google Sheets**. Propose-moi la méthode la plus simple pour connecter mon interface web statique à Google Sheets (par exemple via Google Apps Script).
3. **Sécurité :** Je veux restreindre l'accès au site avec un identifiant et un mot de passe pour le limiter à mes connaissances. Sachant que GitHub Pages ne permet pas d'authentification serveur native, propose-moi et implémente la solution de contournement la plus pragmatique et pertinente pour ce besoin précis.

**Ce que j'attends de toi :**

1. Crée la structure de base du projet (fichiers HTML, CSS, JS).
2. Fournis-moi le code complet de l'interface (gérant l'affichage de la première image "TerminalC.png" avec quelques numéros placés à titre d'exemple, et le panneau de saisie).
3. Explique-moi étape par étape comment configurer la partie Google Sheets (script, déploiement, CORS si besoin) pour que le bouton "Enregistrer" fonctionne.
4. Intègre la solution de protection par mot de passe que tu auras choisie.
5. Je souhaite pouvoir tester le site en local avant de pouvoir le déployer. Il peut donc y avoir un mode debug qui nous permette de travailler sur le projet avant de le déployer sur mon compte GitHub

Sois direct, donne-moi le code et les instructions de configuration sans m'expliquer les concepts basiques de programmation.