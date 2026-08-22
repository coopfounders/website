(() => {
  const dialog = document.querySelector("[data-partner-dialog]");
  const openers = document.querySelectorAll("[data-partner-open]");
  const closer = document.querySelector("[data-partner-close]");
  const form = document.querySelector("[data-partner-form]");
  const status = document.querySelector("[data-form-status]");
  const submitButton = document.querySelector("[data-submit-button]");

  if (!dialog) return;

  openers.forEach((button) => {
    button.addEventListener("click", () => {
      dialog.showModal();
      window.setTimeout(() => dialog.querySelector("input[type='email']")?.focus(), 80);
    });
  });

  closer?.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    const clickedOutside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (clickedOutside) dialog.close();
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const originalLabel = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    status.textContent = "";
    status.className = "form-status";

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "We couldn’t send that right now.");
      }

      form.reset();
      status.textContent = "Thanks — we’ll be in touch.";
      status.classList.add("is-success");
    } catch (error) {
      status.textContent = `${error.message} You can also email founders@cooplabs.com.`;
      status.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalLabel;
    }
  });
})();
