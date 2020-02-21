document.getElementById("menu__toggle").onclick = check;

function check() {
    this.checked === true ? document.getElementsByTagName('header')[0].classList.toggle("active") : 
                            document.getElementsByTagName('header')[0].classList.remove("active");
}