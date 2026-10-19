'use strict';

// Location of the JSON file that stands in for a database in this stage.
const DATA_URL = 'data/solar-system.json';

const STATUS_MESSAGES = {
  loading: 'Loading solar system data...',
  loadError: 'Sorry, the solar system data could not be loaded. Please refresh the page to try again.'
};

// Fetches the solar system JSON file.
// Returns a Promise that resolves to an object with a "groups" array.
function loadSolarData() {
  return fetch(DATA_URL).then((response) => {
    if (!response.ok) {
      throw new Error('Data request failed with status ' + response.status);
    }
    return response.json();
  });
}

// Shows a message in the status area. isError switches on the error styling.
function showStatus(message, isError) {
  const statusElement = document.getElementById('statusMessage');
  statusElement.textContent = message;
  statusElement.classList.toggle('status-error', isError);
  statusElement.hidden = false;
}

// Hides the status area once the data has loaded.
function hideStatus() {
  const statusElement = document.getElementById('statusMessage');
  statusElement.textContent = '';
  statusElement.hidden = true;
}

// Moves keyboard and screen reader focus to the new step's heading,
// so the user knows the page content changed.
function focusStepHeading() {
  const stepHeading = document.querySelector('#explorerView h2');
  if (stepHeading) {
    stepHeading.focus();
  }
}

// Creates the h2 for a step. tabindex -1 lets the script focus it.
// Returns the heading element.
function createStepHeading(text) {
  const headingElement = document.createElement('h2');
  headingElement.textContent = text;
  headingElement.tabIndex = -1;
  return headingElement;
}

// Creates the intro paragraph for a step. Returns the paragraph element.
function createLeadParagraph(text) {
  const paragraphElement = document.createElement('p');
  paragraphElement.classList.add('lead');
  paragraphElement.textContent = text;
  return paragraphElement;
}

// Creates one clickable choice card.
// choice is any object with a name and a summary (a group or a space object).
// onChoose is called with that object when the button is clicked.
// Returns the li element.
function createChoiceCard(choice, onChoose) {
  const cardElement = document.createElement('li');
  cardElement.classList.add('card');

  const headingElement = document.createElement('h3');
  const chooseButton = document.createElement('button');
  chooseButton.type = 'button';
  chooseButton.classList.add('choice-button');
  chooseButton.textContent = choice.name;
  chooseButton.addEventListener('click', () => onChoose(choice));
  headingElement.appendChild(chooseButton);

  const summaryElement = document.createElement('p');
  summaryElement.textContent = choice.summary;

  cardElement.append(headingElement, summaryElement);
  return cardElement;
}

// Creates the list of choice cards. Returns the ul element.
function createChoiceList(choices, onChoose) {
  const listElement = document.createElement('ul');
  listElement.classList.add('card-list');

  choices.forEach((choice) => {
    listElement.appendChild(createChoiceCard(choice, onChoose));
  });
  return listElement;
}

// Creates one fact box, such as "Diameter 4,879 km".
// fact is an object with a label and a value. Returns the li element.
function createFactItem(fact) {
  const factElement = document.createElement('li');
  const labelElement = document.createElement('strong');
  labelElement.textContent = fact.label;
  factElement.append(labelElement, ' ' + fact.value);
  return factElement;
}

// Creates the list of fact boxes for one object. Returns the ul element.
function createFactList(facts) {
  const listElement = document.createElement('ul');
  listElement.classList.add('fact-list');

  facts.forEach((fact) => {
    listElement.appendChild(createFactItem(fact));
  });
  return listElement;
}

// Creates a button that runs onClick when pressed, such as a back button
// or a breadcrumb. className sets how it looks. Returns the button.
function createActionButton(label, className, onClick) {
  const actionButton = document.createElement('button');
  actionButton.type = 'button';
  actionButton.classList.add(className);
  actionButton.textContent = label;
  actionButton.addEventListener('click', onClick);
  return actionButton;
}

// Fills the breadcrumb trail.
// crumbs is an array of { label, onSelect } objects. The last crumb is the
// current step, so it is plain text instead of a button.
function renderBreadcrumbs(crumbs) {
  const breadcrumbList = document.getElementById('breadcrumbs');
  breadcrumbList.innerHTML = '';

  crumbs.forEach((crumb, index) => {
    const crumbItem = document.createElement('li');
    const isCurrentStep = index === crumbs.length - 1;

    if (isCurrentStep) {
      const currentLabel = document.createElement('span');
      currentLabel.setAttribute('aria-current', 'step');
      currentLabel.textContent = crumb.label;
      crumbItem.appendChild(currentLabel);
    } else {
      crumbItem.appendChild(createActionButton(crumb.label, 'crumb-button', crumb.onSelect));
    }
    breadcrumbList.appendChild(crumbItem);
  });
}

// Builds step 1: the list of groups. Returns an array of elements.
function buildGroupStep(groups, onChooseGroup) {
  return [
    createStepHeading('Step 1: choose a group'),
    createLeadParagraph('Pick a group first. Each group has four choices, and each of those shows its own data.'),
    createChoiceList(groups, onChooseGroup)
  ];
}

// Builds step 2: the objects inside one group. Returns an array of elements.
function buildObjectStep(group, onChooseObject, onBack) {
  return [
    createStepHeading('Step 2: choose one'),
    createLeadParagraph(group.description),
    createChoiceList(group.objects, onChooseObject),
    createActionButton('Back to all groups', 'back-button', onBack)
  ];
}

// Builds the final step: the data for one object. Returns an array of elements.
function buildDetailStep(group, spaceObject, onBack) {
  return [
    createStepHeading('Data for ' + spaceObject.name),
    createLeadParagraph(spaceObject.description),
    createFactList(spaceObject.facts),
    createActionButton('Back to ' + group.name, 'back-button', onBack)
  ];
}

// Draws the explorer at the requested step.
// With no group it shows step 1, with a group it shows step 2,
// and with a group and an object it shows that object's data.
function showExplorerStep(solarData, selectedGroup, selectedObject) {
  // Re-draws at a new step and moves focus so screen readers announce it.
  const goToStep = (group, spaceObject) => {
    showExplorerStep(solarData, group, spaceObject);
    focusStepHeading();
  };

  const crumbs = [{ label: 'All groups', onSelect: () => goToStep() }];
  let stepElements;

  if (selectedGroup && selectedObject) {
    crumbs.push({ label: selectedGroup.name, onSelect: () => goToStep(selectedGroup) });
    crumbs.push({ label: selectedObject.name });
    stepElements = buildDetailStep(selectedGroup, selectedObject, () => goToStep(selectedGroup));
  } else if (selectedGroup) {
    crumbs.push({ label: selectedGroup.name });
    stepElements = buildObjectStep(
      selectedGroup,
      (spaceObject) => goToStep(selectedGroup, spaceObject),
      () => goToStep()
    );
  } else {
    stepElements = buildGroupStep(solarData.groups, (group) => goToStep(group));
  }

  const explorerView = document.getElementById('explorerView');
  explorerView.innerHTML = '';
  explorerView.append(...stepElements);
  renderBreadcrumbs(crumbs);
}

// Loads the data, then shows step 1. If the file cannot be loaded,
// an error message is shown instead. The rest of the page stays usable
// while the request is waiting.
function startExplorer() {
  showStatus(STATUS_MESSAGES.loading, false);

  loadSolarData()
    .then((solarData) => {
      hideStatus();
      showExplorerStep(solarData);
    })
    .catch(() => {
      showStatus(STATUS_MESSAGES.loadError, true);
    });
}

startExplorer();
