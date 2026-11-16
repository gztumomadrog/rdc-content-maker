(() => {
  const modal = document.querySelector("#templateAdjustModal");
  const dialog = modal.querySelector(".template-adjust-dialog");
  const stage = document.querySelector("#templateAdjustStage");
  const previewCanvas = document.querySelector("#templateAdjustCanvas");
  const previewContext = previewCanvas.getContext("2d");
  const title = document.querySelector("#templateAdjustTitle");
  const closeButton = document.querySelector("#templateAdjustClose");
  const resetButton = document.querySelector("#templateAdjustReset");
  const modalDownload = document.querySelector("#templateAdjustDownload");
  const nudgeButtons = [...document.querySelectorAll("[data-adjust-nudge]")];

  const rendererByCanvas = new Map([
    [canvases.classic, renderClassic],
    [canvases.courtside, renderCourtside],
    [canvases.spotlight, renderSpotlight],
    [canvases.matchday, renderMatchday],
    [canvases.minimal, renderMinimal],
    [canvases.clean, renderClean],
    [canvases.edge, renderEdge],
    [canvases.corner, renderCorner],
    [canvases.banner, renderBanner],
    [canvases.lowerThird, renderLowerThird],
    [canvases.print, renderPrint],
    [canvases.studio, renderStudio],
    [canvases.sideRail, renderSideRail],
    [canvases.frame, renderFrame],
    [canvases.ribbon, renderRibbon],
    [canvases.focus, renderFocus],
    [canvases.scoreboard, renderScoreboard],
    [canvases.keepsake, renderKeepsake],
    [canvases.centerline, renderCenterline],
    [canvases.cornerFlag, renderCornerFlag],
    [canvases.topline, renderTopline],
    [canvases.baseline, renderBaseline],
    [canvases.ticket, renderTicket],
    [canvases.outline, renderOutline],
    [canvases.slashes, renderSlashes],
    [canvases.openCorners, renderOpenCorners],
    [canvases.pulse, renderPulse],
    [canvases.crest, renderCrest],
    [canvases.fineLine, renderFineLine],
    [canvases.offset, renderOffset],
    [canvases.cornerDots, renderCornerDots],
    [canvases.underline, renderUnderline],
    [canvases.twinBars, renderTwinBars],
    [canvases.redPin, renderRedPin],
    [canvases.message, renderMessage],
    [canvases.textCard, renderTextCard],
    [canvases.textSplit, renderTextSplit],
    [canvases.textEditorial, renderTextEditorial],
    [canvases.textBottom, renderTextBottom],
    [canvases.textQuoteWindow, renderTextQuoteWindow],
    [canvases.textRedline, renderTextRedline],
    [canvases.textHeadline, renderTextHeadline],
    [canvases.textCaption, renderTextCaption]
  ]);

  let activeTemplate = null;
  let dragState = null;
  let lastFocused = null;
  let needsFullRender = false;

  function copyActivePreview() {
    if (!activeTemplate) return;
    previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewContext.drawImage(activeTemplate.canvas, 0, 0, previewCanvas.width, previewCanvas.height);
  }

  function renderActiveTemplate() {
    if (!activeTemplate) return;
    activeTemplate.renderer();
    copyActivePreview();
  }

  function setModalPosition(x, y, renderEveryTemplate = false) {
    setPhotoPosition(x, y, false);
    if (renderEveryTemplate) {
      renderAll();
      copyActivePreview();
      needsFullRender = false;
      return;
    }
    renderActiveTemplate();
    needsFullRender = true;
  }

  function finishGlobalRender() {
    if (!needsFullRender) return;
    renderAll();
    copyActivePreview();
    needsFullRender = false;
  }

  function openModal(button, card) {
    if (!state.photo) return;
    const canvas = card.querySelector("canvas");
    const renderer = rendererByCanvas.get(canvas);
    if (!renderer) return;

    const downloadButton = card.querySelector(".download-btn");
    const designName = card.querySelector(".card-footer h3").textContent.trim();
    activeTemplate = {
      canvas,
      renderer,
      downloadName: downloadButton.dataset.name
    };
    lastFocused = button;
    title.textContent = `${designName} position`;
    modalDownload.disabled = downloadButton.disabled;
    renderActiveTemplate();
    modal.hidden = false;
    document.body.classList.add("has-adjust-modal");
    closeButton.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    finishGlobalRender();
    modal.hidden = true;
    document.body.classList.remove("has-adjust-modal");
    activeTemplate = null;
    dragState = null;
    lastFocused?.focus();
  }

  document.querySelectorAll(".template-card").forEach((card) => {
    const actions = card.querySelector(".card-actions");
    const downloadButton = card.querySelector(".download-btn");
    const adjustButton = document.createElement("button");
    adjustButton.className = "adjust-position-btn";
    adjustButton.type = "button";
    adjustButton.textContent = "Adjust position";
    adjustButton.disabled = downloadButton.disabled;
    actions.insertBefore(adjustButton, downloadButton);

    const disabledObserver = new MutationObserver(() => {
      adjustButton.disabled = downloadButton.disabled;
    });
    disabledObserver.observe(downloadButton, { attributes: true, attributeFilter: ["disabled"] });

    adjustButton.addEventListener("click", () => openModal(adjustButton, card));
  });

  stage.addEventListener("pointerdown", (event) => {
    if (!activeTemplate || !state.photo) return;
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      photoX: state.photoPosition.x,
      photoY: state.photoPosition.y
    };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("is-dragging");
  });

  stage.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const bounds = stage.getBoundingClientRect();
    const nextX = dragState.photoX - (event.clientX - dragState.startX) / bounds.width;
    const nextY = dragState.photoY - (event.clientY - dragState.startY) / bounds.height;
    setModalPosition(nextX, nextY);
  });

  function finishDrag(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    dragState = null;
    stage.classList.remove("is-dragging");
    finishGlobalRender();
  }

  stage.addEventListener("pointerup", finishDrag);
  stage.addEventListener("pointercancel", finishDrag);

  stage.addEventListener("keydown", (event) => {
    const directions = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    movePhoto(direction);
    copyActivePreview();
  });

  nudgeButtons.forEach((button) => button.addEventListener("click", () => {
    movePhoto(button.dataset.adjustNudge);
    copyActivePreview();
  }));

  resetButton.addEventListener("click", () => {
    setModalPosition(.5, .5, true);
  });

  modalDownload.addEventListener("click", () => {
    if (!activeTemplate) return;
    finishGlobalRender();
    downloadCanvas(activeTemplate.canvas, activeTemplate.downloadName);
  });

  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-adjust-close")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...dialog.querySelectorAll("button:not(:disabled), [tabindex='0']")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
