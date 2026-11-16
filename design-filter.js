(() => {
  const filter = document.querySelector("#designFilter");
  const tabs = [...document.querySelectorAll(".mode-tab")];
  const cards = {
    photo: [...document.querySelectorAll("#photoTemplateGrid .template-card")],
    text: [...document.querySelectorAll("#textTemplateGrid .template-card")]
  };

  function getActiveMode() {
    return document.querySelector(".mode-tab.is-active")?.dataset.mode || "photo";
  }

  function getDesignName(card) {
    return card.querySelector(".card-footer h3")?.textContent.trim() || "";
  }

  function applyFilter() {
    const activeCards = cards[getActiveMode()];
    activeCards.forEach((card) => {
      card.hidden = filter.value !== "all" && getDesignName(card) !== filter.value;
    });
  }

  function refreshFilter() {
    Object.values(cards).flat().forEach((card) => { card.hidden = false; });
    filter.replaceChildren(new Option("All designs", "all"));
    cards[getActiveMode()].forEach((card) => {
      const designName = getDesignName(card);
      filter.add(new Option(designName, designName));
    });
    filter.value = "all";
  }

  filter.addEventListener("change", applyFilter);
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    window.requestAnimationFrame(refreshFilter);
  }));

  refreshFilter();
})();
