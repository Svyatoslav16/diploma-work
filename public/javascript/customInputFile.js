let fields = document.getElementsByClassName('field__file');
for(let i = 0; i < fields.length; i++) {
    fields[i].addEventListener('change', function () {
        this.parentElement.children[1].children[1].children[0].data = 'images/correct.svg';
        this.parentElement.children[1].children[0].innerText = this.files[0].name;
    });
}
