'use strict';

function loadBoardingData() {
  return fetch('js/boardingData.json').then(function (response) {
    return response.json();
  });
}

function fillCards(gridId, cards) {
  const cardElements = document.querySelectorAll('#' + gridId + ' .card');

  for (let i = 0; i < cards.length; i++) {
    cardElements[i].querySelector('h3').textContent = cards[i].title;
    cardElements[i].querySelector('p').textContent = cards[i].description;
  }
}

function updateText(data) {
  document.querySelector('title').textContent = data.title;
  document.getElementById('styleName').textContent = data.header;
  document.getElementById('heroTitle').textContent = data.hero.headline;
  document.getElementById('heroDesc').textContent = data.hero.description;
  document.getElementById('sec1Title').textContent = data.sections.overview.title;
  document.getElementById('sec1Subtitle').textContent = data.sections.overview.subtitle;
  document.getElementById('sec2Title').textContent = data.sections.equipment.title;
  document.getElementById('sec2Subtitle').textContent = data.sections.equipment.subtitle;

  fillCards('sec1Grid', data.sections.overview.cards);
  fillCards('sec2Grid', data.sections.equipment.cards);
}

function updateImage(imagePath) {
  const hero = document.getElementById('heroSection');
  hero.style.setProperty('--hero-img', 'url("' + imagePath + '")');
}

function showSnowboardPage() {
  loadBoardingData().then(function (data) {
    updateText(data);
    updateImage(data.hero.image);
  });
}

document.getElementById('changeThemeBtn').addEventListener('click', showSnowboardPage);
