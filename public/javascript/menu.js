let menuBtn = document.querySelector('.menu__btn');
let submenu = document.querySelectorAll('li.submenu');
let myProfile = document.querySelector('.my-profile-wrap span');

if(submenu.length > 0) {
    submenu.forEach(el => {
        el.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
}

if(myProfile !== null) {
    myProfile.addEventListener('click', function() {
        this.parentNode.classList.toggle('active');
    });
}

if(menuBtn) {
    menuBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        this.parentNode.parentNode.children[0].classList.toggle('active');
    });
}