let arrowWrap = document.getElementsByClassName('arrow-up_wrap')[0];
window.addEventListener('scroll', function() {
    setTimeout(() => {
        if(window.pageYOffset > 100) {
            arrowWrap.classList.add('show');
        } else {
            arrowWrap.classList.remove('show');
        }
    }, 500);
});

arrowWrap.addEventListener('click', () => {
    window.scrollTo(0,0);
});