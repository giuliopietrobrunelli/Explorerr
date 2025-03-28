
class ExplorerApp {
    constructor() {
        this.scrollView = document.getElementById('scroll-view');
        this.currentArticles = [];
        this.isLoading = false;
        this.articleIndex = 0;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.scrollView.addEventListener('scroll', this.handleScroll.bind(this));
    }

    async handleScroll() {
        const scrollPosition = this.scrollView.scrollTop;
        const scrollHeight = this.scrollView.scrollHeight;
        const viewportHeight = this.scrollView.clientHeight;

        const currentArticleIndex = Math.floor(scrollPosition / viewportHeight);

        if (!this.isLoading && 
            (currentArticleIndex >= this.articleIndex - 2 || 
            scrollPosition + viewportHeight >= scrollHeight * 0.8)) {
            await this.loadArticles();
        }
    }

    async fetchQualityArticles() {
        try {
            const response = await fetch('https://it.wikipedia.org/w/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'query',
                    format: 'json',
                    list: 'random',
                    rnnamespace: 0,
                    rnlimit: 10,
                    origin: '*'
                })
            });

            const data = await response.json();
            const articleIds = data.query.random.map(article => article.id);

            return this.fetchArticleDetails(articleIds);
        } catch (error) {
            console.error('Errore nel recupero degli articoli:', error);
            return [];
        }
    }

    async fetchArticleDetails(articleIds) {
        try {
            const response = await fetch('https://it.wikipedia.org/w/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'query',
                    format: 'json',
                    prop: 'extracts|pageimages|info',
                    exintro: true,
                    explaintext: true,
                    pithumbsize: 500,
                    inprop: 'url',
                    pageids: articleIds.join('|'),
                    origin: '*'
                })
            });

            const data = await response.json();
            return Object.values(data.query.pages)
                .filter(page => page.extract && page.thumbnail)
                .map(page => ({
                    title: page.title,
                    summary: page.extract,
                    imageUrl: page.thumbnail.source,
                    articleUrl: page.fullurl,
                    tags: this.extractTags(page.title)
                }));
        } catch (error) {
            console.error('Errore nel recupero dei dettagli degli articoli:', error);
            return [];
        }
    }

    extractTags(title) {
        const possibleTags = [
            'Scienza', 'Natura', 'Storia', 'Tecnologia', 
            'Arte', 'Geografia', 'Animali', 'Spazio'
        ];
        return [
            possibleTags[Math.floor(Math.random() * possibleTags.length)],
            possibleTags[Math.floor(Math.random() * possibleTags.length)]
        ];
    }

    async loadArticles() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        try {
            const newArticles = await this.fetchQualityArticles();
            this.currentArticles.push(...newArticles);
            this.renderArticles(newArticles);
            feather.replace();
        } catch (error) {
            console.error('Errore nel caricamento degli articoli:', error);
        } finally {
            this.isLoading = false;
        }
    }

    renderArticles(articles) {
        articles.forEach(article => {
            const scrollViewContent = this.createScrollViewContent(article);
            this.scrollView.appendChild(scrollViewContent);
        });
        this.articleIndex += articles.length;
    }

    createScrollViewContent(article) {
        // Crea un nuovo container per l'articolo seguendo la struttura HTML fornita
        const scrollViewContent = document.createElement('div');
        scrollViewContent.className = 'scroll-view-content';

        // Background blurred image
        const backgroundBlur = document.createElement('div');
        backgroundBlur.className = 'scroll-view-background';
        backgroundBlur.style.backgroundImage = `url(${article.imageUrl})`;
        scrollViewContent.appendChild(backgroundBlur);

        // Article image
        const articleImageDiv = document.createElement('div');
        articleImageDiv.className = 'article-image';
        articleImageDiv.style.backgroundImage = `url(${article.imageUrl})`;
        scrollViewContent.appendChild(articleImageDiv);

        // Article infos
        const articleInfos = document.createElement('div');
        articleInfos.className = 'article-infos';

        // Vertical paragraph container
        const verticalParagraphContainer = document.createElement('div');
        verticalParagraphContainer.className = 'vertical-paragraph-container';

        // Article tags
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'article-tags';
        article.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'article-tag';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
        verticalParagraphContainer.appendChild(tagsContainer);

        // Article text content container
        const textContentContainer = document.createElement('div');
        textContentContainer.className = 'vertical-paragraph-container';

        // Title
        const titleElement = document.createElement('span');
        titleElement.className = 'article-title';
        titleElement.textContent = article.title;
        textContentContainer.appendChild(titleElement);

        // Body
        const bodyElement = document.createElement('span');
        bodyElement.className = 'article-body';
        bodyElement.textContent = article.summary;
        textContentContainer.appendChild(bodyElement);

        verticalParagraphContainer.appendChild(textContentContainer);

        // Wikipedia link
        const wikiLink = document.createElement('a');
        wikiLink.className = 'article-wikiDirectLink';
        wikiLink.href = article.articleUrl;
        wikiLink.textContent = 'Leggi su Wikipedia';
        wikiLink.target = '_blank'; // Aggiunto target blank
        verticalParagraphContainer.appendChild(wikiLink);

        articleInfos.appendChild(verticalParagraphContainer);

        // Article actions
        const articleActions = document.createElement('div');
        articleActions.className = 'article-actions';

        // Like action
        const likeAction = document.createElement('div');
        likeAction.className = 'article-like article-action';
        const heartIcon = document.createElement('i');
        heartIcon.setAttribute('data-feather', 'book-open');
        const likeCount = document.createElement('span');
        likeCount.className = 'article-like-num';
        likeCount.textContent = '1.3Mln';
        likeAction.appendChild(heartIcon);
        likeAction.appendChild(likeCount);
        articleActions.appendChild(likeAction);

        // Share action
        const shareAction = document.createElement('div');
        shareAction.className = 'article-share article-action';
        const shareIcon = document.createElement('i');
        shareIcon.setAttribute('data-feather', 'share-2');
        const shareCount = document.createElement('span');
        shareCount.className = 'article-share-num';
        shareCount.textContent = '125k';
        shareAction.appendChild(shareIcon);
        shareAction.appendChild(shareCount);
        articleActions.appendChild(shareAction);

        // Aggiungiamo l'event listener per la condivisione
        shareAction.addEventListener('click', async () => {
            try {
                if (navigator.share) {
                    // Utilizziamo l'API Web Share se disponibile
                    await navigator.share({
                        title: article.title,
                        text: article.summary,
                        url: article.articleUrl
                    });
                } else {
                    // Fallback: copiamo il link negli appunti
                    await navigator.clipboard.writeText(article.articleUrl);
                    
                    // Mostriamo un feedback all'utente
                    const feedback = document.createElement('div');
                    feedback.classList.add("feedback");
                    feedback.textContent = 'Link copiato!';
                    feedback.style.position = 'fixed';
                    feedback.style.bottom = '120px';
                    feedback.style.left = '50%';
                    feedback.style.transform = 'translateX(-50%)';
                    feedback.style.padding = '10px 20px';
                    feedback.style.borderRadius = '5px';
                    feedback.style.zIndex = '1000';
                    
                    document.body.appendChild(feedback);
                    
                    setTimeout(() => {
                        feedback.remove();
                    }, 2000);
                }
            } catch (error) {
                console.error('Errore durante la condivisione:', error);
            }
        });

        articleInfos.appendChild(articleActions);
        scrollViewContent.appendChild(articleInfos);

        // Aggiungiamo la logica di like/dislike
        const likeIcon = heartIcon;
        const likeNum = likeCount;
        let isLiked = false;

        // Aspettiamo che feather.replace() abbia convertito l'icona
        setTimeout(() => {
            // Ora selezioniamo l'SVG creato da Feather
            const svgIcon = likeAction.querySelector('svg');
            
            // Event listeners
            scrollViewContent.addEventListener('dblclick', (event) => {
                animateLike(svgIcon, likeNum, event);
                isLiked = true;
            });

            likeAction.addEventListener('click', (event) => {
                if (isLiked) {
                    isLiked = false;
                    animateDislike(svgIcon, likeNum, event);
                } else {
                    isLiked = true;
                    animateLike(svgIcon, likeNum, event);
                }
            });
        }, 0);

        const animateLike = (svgIcon, likeNum, event) => {
            const clickX = event ? event.clientX : svgIcon.getBoundingClientRect().left + svgIcon.offsetWidth / 2;
            const clickY = event ? event.clientY : svgIcon.getBoundingClientRect().top + svgIcon.offsetHeight / 2;

            anime({
                targets: svgIcon,
                scale: [0, 2.3, 1],
                duration: 300,
                easing: 'easeOutBack',
            });

            svgIcon.style.fill = "var(--red-contrast)";
            svgIcon.style.stroke = "var(--red)";
            likeNum.style.color = "var(--red-light)";

            anime({
                targets: likeNum,
                scale: [1, 0.1, 1],
                duration: 300,
                easing: 'easeOutBack'
            });

            this.createLikeParticles(clickX, clickY);
        };

        const animateDislike = (svgIcon, likeNum, event) => {
            anime({
                targets: svgIcon,
                scale: [0, 1.5, 1],
                duration: 300,
                easing: 'easeOutBack',
            });

            svgIcon.style.fill = "none";
            svgIcon.style.stroke = "var(--secondary)";
            likeNum.style.color = "var(--secondary-3)";

            anime({
                targets: likeNum,
                scale: [1, 0.1, 1],
                duration: 300,
                easing: 'easeOutBack'
            });
        };

        return scrollViewContent;
    }

    createLikeParticles(x, y) {
        const particlesContainer = document.createElement('div');
        particlesContainer.style.position = 'fixed';
        particlesContainer.style.left = `${x}px`;
        particlesContainer.style.top = `${y}px`;
        particlesContainer.style.pointerEvents = 'none';
        particlesContainer.style.zIndex = '1000';

        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '5px';
            particle.style.height = '5px';
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = 'var(--red)';
            particlesContainer.appendChild(particle);

            anime({
                targets: particle,
                translateX: anime.random(-100, 100),
                translateY: anime.random(-100, 100),
                scale: [2.5, 0],
                opacity: [1, 0],
                duration: 800,
                easing: 'easeOutQuad'
            });
        }

        document.body.appendChild(particlesContainer);
        
        setTimeout(() => {
            particlesContainer.remove();
        }, 1000);
    }

    async init() {
        await this.loadArticles();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const explorerApp = new ExplorerApp();
    explorerApp.init();
});
