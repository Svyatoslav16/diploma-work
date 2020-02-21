const selectBox = document.getElementsByClassName('select-box');

for (let i = 0; i < selectBox.length; i++) {
  const selected = selectBox[i].getElementsByClassName("selected");
  const optionsContainer = selectBox[i].getElementsByClassName("options-container");
  const optionsList = selectBox[i].getElementsByClassName("option");
  
  for (let i = 0; i < selected.length; i++) {
    selected[i].addEventListener("click", () => {
      optionsContainer[0].classList.toggle("active");
    });
  }

  for (let i = 0; i < optionsList.length; i++) {
    optionsList[i].addEventListener("click", () => {
      optionsList[i].children[0].checked = 'true';
      selected[0].innerHTML = optionsList[i].children[1].innerHTML;
      optionsContainer[0].classList.remove("active");
    });
  }
}
