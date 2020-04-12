document.querySelectorAll('.submenu').forEach(el => {
    el.addEventListener('click', function() {
        this.classList.toggle('active');
    });
});

document.querySelector('.menu__btn').addEventListener('click', function() {
    this.classList.toggle('active');
    this.parentNode.children[1].classList.toggle('active');
});