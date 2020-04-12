// в addEventListener не используются стрелочные функции чтобы получить this 
document.getElementsByClassName('sign-in-form')[0].addEventListener('submit', function () {
    event.preventDefault();
    if ( checkLogin(this.children[1], this.children[1].children[0].value) &&
         checkPassword(this.children[2].children[0], this.children[2].children[0].value) ) {     
        this.action = '/signIn';
        this.method = 'POST';
        this.submit();
    }
});

document.getElementsByName('login')[0].addEventListener('input', function() {
    if( checkLogin(this.parentNode, this.value) ) {
        console.log(this.nextElementSibling.nextElementSibling.style);
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        this.nextElementSibling.className = "login-label material-design-label-for-input valid";
    } else if(this.value.length > 0) {
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        this.nextElementSibling.nextElementSibling.className = "cross-icon active";
        this.nextElementSibling.className = "login-label material-design-label-for-input";
    } else if(this.value.length === 0) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
    }
});

document.getElementsByName('password')[0].addEventListener('input', function() {
    if( checkPassword(this.parentNode, this.value) ) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon active";
        this.nextElementSibling.className = "login-label material-design-label-for-input valid";
    } else if(this.value.length > 0) {
        this.nextElementSibling.nextElementSibling.nextElementSibling.className = "correct-icon";
        this.nextElementSibling.nextElementSibling.className = "cross-icon active";
        this.nextElementSibling.className = "login-label material-design-label-for-input";
    } else if(this.value.length === 0) {
        this.nextElementSibling.nextElementSibling.className = "cross-icon";
    }
});

/** Проверка логина по email или номеру*/
function checkLogin(loginInputWrap, login) {
    if( login.match(/@/g) ) {
        if( login.match(/^[\w]{1}[\w-\.]*@[\w-]+\.[a-z]{2,10}$/i) ) {
            return true;
        } else {
            return false;
        }
    } else {
        if( login.match(/^8[0-9]{10}$/) ) { 
            return true;
        } else {
            return false;
        }
    }    
}

/** Проверка пароля на длину > 6, содержание латинских символов и цифр */
function checkPassword(passwordInput, password) {
    if( password.match(/(?=.*[0-9]{2,})(?=.*[a-z])[0-9a-z]{6,}/g) ) {
        return true;
    } else {
        return false;
    }
}