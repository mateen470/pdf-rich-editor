document.addEventListener("DOMContentLoaded", function () {
  // Custom Quill Image Blot
  const ImageFormat = Quill.import("formats/image");
  class CustomImage extends ImageFormat {
    static create(value) {
      let node = super.create(value);
      node.setAttribute("src", value);
      node.style.width = "250px";
      node.style.height = "250px";
      return node;
    }
  }
  CustomImage.blotName = "customImage";
  CustomImage.tagName = "img";
  Quill.register(CustomImage, true);

  // Custom Quill Emoji Blot
  const EmojiImageBlot = Quill.import("formats/image");
  class EmojiImage extends EmojiImageBlot {
    static create(value) {
      const node = super.create();
      node.setAttribute("src", value);
      node.setAttribute("data-emoji", "true");
      node.classList.add("emoji-image");
      node.style.width = "25px";
      node.style.height = "25px";
      node.style.display = "inline";
      node.style.verticalAlign = "middle";
      node.style.margin = "5px";
      return node;
    }
    static value(node) {
      return node.getAttribute("src");
    }
  }
  EmojiImage.blotName = "emojiImage";
  EmojiImage.tagName = "img";
  Quill.register(EmojiImage);

  // Custom Quill PageBreak Blot
  const BlockEmbed = Quill.import("blots/block/embed");
  class PageBreakBlot extends BlockEmbed {
    static create() {
      let node = super.create();
      node.setAttribute("contenteditable", false);
      node.classList.add("page-break");
      node.innerHTML =
        '<hr style="border: none; border-top: 2px dashed #ccc; margin: 20px 0;" />';
      return node;
    }
    static value(node) {
      return node.innerHTML;
    }
  }
  PageBreakBlot.blotName = "pageBreak";
  PageBreakBlot.tagName = "div";
  Quill.register(PageBreakBlot);

  // Convert emoji character to image URL
  function getEmojiImageUrl(emoji) {
    const codePoints = Array.from(emoji)
      .map((char) => char.codePointAt(0).toString(16))
      .join("-");
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${codePoints}.svg`;
  }

  // Quill Editor Setup
  let quills = [];
  const taskForm = document.getElementById("taskForm");
  const taskCount = parseInt(taskForm.dataset.taskCount, 10) || 0;
  const solutionCount = parseInt(taskForm.dataset.solutionCount, 10) || 0;
  const generatePdfUrl = taskForm.dataset.pdfUrl;
  const generateDocxUrl = taskForm.dataset.docxUrl;

  function adjustContent(content) {
    if (content.includes("Name:") && content.includes("Datum:")) {
      content = content.replace(/_+/g, "");
      content = content.replace(/Name:\s+/g, "Name:");
      content = content.replace(/Datum:\s+/g, "Datum:");
      content = content.replace("Name:", "Name:<p></p>");
    }
    return content;
  }

  function createToolbarForEditor(index) {
    const toolbarContainer = document.getElementById("toolbar-container");
    if (!toolbarContainer) return null;
    const template = document.getElementById("toolbar-template");
    if (!template) return null;
    const clone = document.importNode(template.content, true);
    const wrapper = document.createElement("div");
    wrapper.id = "quill-toolbar-" + index;
    wrapper.className = "flex flex-wrap items-center justify-center";
    wrapper.style.border = "none";
    wrapper.appendChild(clone);
    toolbarContainer.appendChild(wrapper);
    wrapper.style.display = "none";
    return "#" + wrapper.id;
  }

  // Initializing the quill-editors
  function initializeEditor(selector, index) {
    const editorElement = document.querySelector(selector);
    if (!editorElement) return null;
    const initialContent = adjustContent(editorElement.innerHTML.trim());
    const toolbarSelector = createToolbarForEditor(index);
    if (!toolbarSelector) return null;
    const quill = new Quill(selector, {
      modules: {
        toolbar: {
          container: toolbarSelector,
          handlers: {
            pageBreak: function () {
              const range = this.quill.getSelection(true);
              if (range) {
                this.quill.insertEmbed(
                  range.index,
                  "pageBreak",
                  "true",
                  Quill.sources.USER
                );
                this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
              }
            },
          },
        },
      },
      placeholder: "Schreibe etwas ...",
      theme: "snow",
    });

    quill.root.innerHTML = initialContent;
    quill.root.addEventListener("focus", () => {
      document
        .querySelectorAll("[id^='quill-toolbar-']")
        .forEach((t) => (t.style.display = "none"));
      const thisToolbar = document.getElementById("quill-toolbar-" + index);
      if (thisToolbar) thisToolbar.style.display = "flex";
    });
    return quill;
  }
  for (let i = 1; i <= taskCount; i++) {
    const quill = initializeEditor(`#editor-${i}`, i);
    if (quill) quills.push({ id: `input-${i}`, editor: quill });
  }
  for (let i = 1; i <= solutionCount; i++) {
    const index = taskCount + i;
    const quill = initializeEditor(`#editor-solution-${i}`, index);
    if (quill) quills.push({ id: `solution-input-${i}`, editor: quill });
  }
  if (quills.length > 0) {
    quills[0].editor.focus();
    const firstToolbar = document.getElementById("quill-toolbar-1");
    if (firstToolbar) firstToolbar.style.display = "flex";
  }

  //Submit Form
  function submitForm(actionUrl) {
    // Clear any existing values first to prevent data persistence
    document
      .querySelectorAll(
        'input[type="hidden"][id^="input-"], input[type="hidden"][id^="solution-input-"]'
      )
      .forEach((input) => {
        input.value = "";
      });

    // Set form values from quill editors
    quills.forEach(({ id, editor }) => {
      let content = editor.root.innerHTML.trim();
      if (content === "<p><br></p>" || content === "") content = "";
      document.getElementById(id).value = content;
    });

    console.log("Setting form action to:", actionUrl);
    console.log(
      "Download mode:",
      document.querySelector('input[name="download_mode"]')?.value
    );

    // Set the form action and submit
    taskForm.action = actionUrl;
    taskForm.submit();
  }

  // Image resizer
  function setupResizableObserver(editor) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // Handle images
          if (
            node.nodeName === "IMG" &&
            node.getAttribute("data-emoji") !== "true"
          ) {
            if (!node.dataset.resizableAttached) {
              node.dataset.resizableAttached = true;
              interact(node)
                .resizable({
                  edges: { left: true, right: true, bottom: true, top: true },
                  modifiers: [
                    interact.modifiers.restrictSize({
                      min: { width: 50, height: 50 },
                      max: { width: 800, height: 600 },
                    }),
                  ],
                  inertia: true,
                })
                .on("resizemove", function (event) {
                  event.target.style.width = event.rect.width + "px";
                  event.target.style.height = event.rect.height + "px";
                });
            }
          }

          // Handle shapes
          if (node.classList?.contains("svg-shape-background")) {
            if (!node.dataset.resizableAttached) {
              node.dataset.resizableAttached = true;
              interact(node)
                .resizable({
                  edges: { left: true, right: true, bottom: true, top: true },
                  modifiers: [
                    interact.modifiers.restrictSize({
                      min: { width: 50, height: 50 },
                      max: { width: 800, height: 600 },
                    }),
                  ],
                  inertia: true,
                })
                .on("resizemove", function (event) {
                  event.target.style.width = event.rect.width + "px";
                  event.target.style.height = event.rect.height + "px";
                });
            }
          }
        });
      });
    });

    // Observe the editor's root for newly added elements
    observer.observe(editor.root, {
      childList: true,
      subtree: true,
    });
  }

  // Global Dragstart Handler.
  document.querySelectorAll(".draggable-item").forEach((item) => {
    if (!item.hasAttribute("data-resource-id")) {
      item.addEventListener("dragstart", function (e) {
        const dataSrc = e.target.getAttribute("data-src");
        const dataType = e.target.getAttribute("data-type");
        e.dataTransfer.setData("text/plain", dataSrc);
        e.dataTransfer.setData("item-type", dataType);
      });
    }
  });

  // UI Handlers (Dropdowns, Tabs)
  const dropdownToggle = document.getElementById("dropdown-toggle");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const dropdownIcon = dropdownToggle.querySelector("svg");
  const mainArrows = document.querySelectorAll(".main-arrow");
  const mainOptions = document.querySelectorAll(
    "#dropdown-main-options .main-option"
  );
  const submenus = document.querySelectorAll(".dropdown-submenu");

  function openDropdown() {
    dropdownMenu.classList.remove(
      "opacity-0",
      "scale-95",
      "pointer-events-none"
    );
    dropdownMenu.classList.add(
      "opacity-100",
      "scale-100",
      "pointer-events-auto"
    );
    if (dropdownIcon) dropdownIcon.classList.add("rotate-90");
  }

  function closeDropdown() {
    dropdownMenu.classList.remove(
      "opacity-100",
      "scale-100",
      "pointer-events-auto"
    );
    dropdownMenu.classList.add("opacity-0", "scale-95", "pointer-events-none");
    submenus.forEach((submenu) => {
      hideSubmenu(submenu);
    });
    mainArrows.forEach((arrow) => {
      arrow.classList.remove("rotate-90");
      arrow.classList.add("rotate-0");
    });
    mainOptions.forEach((btn) => btn.classList.remove("bg-gray-200"));
    activeMainOption = null;
    if (dropdownIcon) dropdownIcon.classList.remove("rotate-90");
  }

  dropdownToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    if (dropdownMenu.classList.contains("opacity-100")) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  document.addEventListener("click", function (e) {
    if (!dropdownToggle.contains(e.target)) {
      closeDropdown();
    }
  });

  let activeMainOption = null;
  mainOptions.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.stopPropagation();
      const submenuKey = button.getAttribute("data-submenu");
      const submenu = document.getElementById(`dropdown-submenu-${submenuKey}`);
      const arrow = button.querySelector(".main-arrow");
      mainOptions.forEach((btn) => {
        btn.classList.remove("bg-gray-200");
        btn.querySelector(".main-arrow").classList.remove("rotate-90");
      });
      if (activeMainOption !== submenuKey) {
        activeMainOption = submenuKey;
        button.classList.add("bg-gray-200");
        showSubmenu(submenu, arrow);
      } else {
        activeMainOption = null;
        hideSubmenu(submenu);
      }
    });
  });

  function showSubmenu(submenu, arrow) {
    submenus.forEach((sm) => hideSubmenu(sm));
    if (arrow) arrow.classList.add("rotate-90");
    submenu.style.maxHeight = `${submenu.scrollHeight}px`;
    submenu.classList.add("opacity-100");
  }

  function hideSubmenu(submenu) {
    const arrow = submenu.parentElement.querySelector(".main-arrow");
    if (arrow) arrow.classList.remove("rotate-90");
    submenu.style.maxHeight = "0";
    submenu.classList.remove("opacity-100");
  }

  document.querySelectorAll(".back-button").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const submenu = btn.parentElement;
      hideSubmenu(submenu);
    });
  });

  document.querySelectorAll("button.sub-option").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();

      // Remove previous hidden inputs if they exist
      document
        .querySelectorAll(
          'input[name="download_mode"], input[name="download_format"]'
        )
        .forEach((el) => el.remove());

      const format = btn.getAttribute("data-format");
      const mode = btn
        .closest(".dropdown-submenu")
        .id.replace("dropdown-submenu-", "");

      // Log to debug
      console.log("Selected download mode:", mode);
      console.log("Selected format:", format);

      // Create new hidden inputs
      const modeInput = document.createElement("input");
      modeInput.type = "hidden";
      modeInput.name = "download_mode";
      modeInput.value = mode;

      const formatInput = document.createElement("input");
      formatInput.type = "hidden";
      formatInput.name = "download_format";
      formatInput.value = format;

      // Add inputs to form
      taskForm.appendChild(modeInput);
      taskForm.appendChild(formatInput);

      // Determine the appropriate action URL
      const action = format === "pdf" ? generatePdfUrl : generateDocxUrl;

      // Set the action and submit
      taskForm.action = action;

      // Debug output before submission
      console.log("Form data:", new FormData(taskForm));
      console.log("Submitting form to:", action);

      // Submit the form
      submitForm(action);
      closeDropdown();
    });
  });

  // Tab switching with content initialization
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");
  const defaultTab = "images";

  // Set the default tab as visible
  tabPanels.forEach((panel) => {
    if (panel.id === "tab-" + defaultTab) panel.classList.remove("hidden");
    else panel.classList.add("hidden");
  });

  // Set the default tab button as active
  const defaultButton = document.querySelector(
    `.tab-button[data-tab="${defaultTab}"]`
  );
  if (defaultButton) {
    defaultButton.classList.add("bg-[#21B0C0]", "font-bold");
    const underline = defaultButton.querySelector("span.absolute");
    if (underline) underline.classList.add("w-full");
  }

  // Initialize the default tab's content
  if (defaultTab === "images") {
    window.fetchTrendingImages && window.fetchTrendingImages();
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetTab = button.getAttribute("data-tab");

      // Switch panels without animation
      tabPanels.forEach((panel) => {
        if (panel.id === "tab-" + targetTab) panel.classList.remove("hidden");
        else panel.classList.add("hidden");
      });

      // Update button styles
      tabButtons.forEach((btn) => {
        btn.classList.remove("bg-[#21B0C0]", "font-bold");
        const underline = btn.querySelector("span.absolute");
        if (underline) underline.classList.remove("w-full");
      });
      button.classList.add("bg-[#21B0C0]", "font-bold");
      const underline = button.querySelector("span.absolute");
      if (underline) underline.classList.add("w-full");

      // Initialize content for the selected tab if needed
      if (targetTab === "images") {
        const imageContainer = document.getElementById("imageContainer");
        if (imageContainer && imageContainer.children.length === 0) {
          window.fetchTrendingImages && window.fetchTrendingImages();
        }
      } else if (targetTab === "sticker") {
        const stickerContainer = document.getElementById("stickerContainer");
        if (stickerContainer && stickerContainer.children.length === 0) {
          window.fetchStickers && window.fetchStickers("sticker");
        }
      } else if (targetTab === "design") {
        // If design tab selected and is empty, initialize design content
        const designContainer = document.getElementById("designContainer");
        if (designContainer && designContainer.children.length === 0) {
          window.initializeDesignShapes && window.initializeDesignShapes();
        }
      } else if (targetTab === "emoji") {
        // If emoji tab selected and is empty, initialize emoji content
        const emojiContainer = document.getElementById("emojiContainer");
        if (emojiContainer && emojiContainer.children.length === 0) {
          window.initializeEmojis && window.initializeEmojis();
        }
      }
    });
  });

  // Quill editor drop handling.
  quills.forEach(({ editor }) => {
    // Initialize each dropped asset with resize function
    setupResizableObserver(editor);

    const container = editor.root;
    container.addEventListener("dragover", (e) => e.preventDefault());
    container.addEventListener("drop", function (e) {
      e.preventDefault();
      editor.focus();
      let dropIndex = 0;
      if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
        if (pos) {
          const node = pos.offsetNode;
          const offset = pos.offset;
          const blot = Quill.find(node, true);
          if (blot) dropIndex = editor.getIndex(blot) + offset;
        }
      } else {
        const selection = editor.getSelection(true);
        dropIndex = selection ? selection.index : 0;
      }

      const dt = e.dataTransfer;
      const type = dt.getData("item-type");

      // Handle background shapes
      if (type === "bg-shape") {
        const htmlContent = dt.getData("text/html");
        if (htmlContent) {
          editor.clipboard.dangerouslyPasteHTML(dropIndex, htmlContent);
          editor.setSelection(dropIndex + 1);

          // Make spans resizable just like images
          setTimeout(() => {
            const spans = editor.root.querySelectorAll(".svg-shape-background");
            spans.forEach((span) => {
              if (!span.dataset.resizableAttached) {
                span.dataset.resizableAttached = true;
                interact(span)
                  .resizable({
                    edges: { left: true, right: true, bottom: true, top: true },
                    modifiers: [
                      interact.modifiers.restrictSize({
                        min: { width: 50, height: 50 },
                        max: { width: 800, height: 600 },
                      }),
                    ],
                    inertia: true,
                  })
                  .on("resizemove", function (event) {
                    event.target.style.width = event.rect.width + "px";
                    event.target.style.height = event.rect.height + "px";
                  });
              }
            });
          }, 0);

          return;
        }
      }

      // Handle custom uploads
      if (type === "custom-upload") {
        let src = dt.getData("text/plain").trim();
        if (src) {
          src = encodeURI(src).replace(/'/g, "%27").replace(/"/g, "%22");
          editor.insertEmbed(dropIndex, "customImage", src);
          editor.setSelection(dropIndex + 1);
          attachImageResizer(editor);
        }
        return;
      }

      // Handle regular images
      if (type === "image") {
        let src = dt.getData("text/plain").trim();
        if (!src) {
          const htmlData = dt.getData("text/html");
          if (htmlData) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = htmlData;
            const imgElem = tempDiv.querySelector("img");
            if (imgElem) src = imgElem.getAttribute("src");
          }
        }
        if (src) {
          src = encodeURI(src).replace(/'/g, "%27").replace(/"/g, "%22");
          editor.insertEmbed(dropIndex, "customImage", src);
          editor.setSelection(dropIndex + 1);
          attachImageResizer(editor);
        }
      }
      // Regular shapes - keep for backward compatibility
      else if (type === "shape") {
        let src = dt.getData("text/plain");
        editor.insertEmbed(dropIndex, "customImage", src);
        editor.setSelection(dropIndex + 1);
        attachImageResizer(editor);
      }
      // Emoji handling
      else if (type === "emoji") {
        let emojiChar = dt.getData("text/plain");
        const emojiImageUrl = getEmojiImageUrl(emojiChar);
        const combinedHtml = `<img src="${emojiImageUrl}" data-emoji="true" data-emoji-char="${emojiChar}" class="emoji-image" alt="${emojiChar}" style="width:25px; height:25px; display:inline; vertical-align:middle; margin:5px;"/>`;
        editor.clipboard.dangerouslyPasteHTML(dropIndex, combinedHtml);
        editor.setSelection(dropIndex + 1, Quill.sources.SILENT);
      }
      // File handling
      else if (dt.files && dt.files.length > 0) {
        for (let i = 0; i < dt.files.length; i++) {
          let file = dt.files[i];
          if (file.type.startsWith("image/")) {
            let currentDropIndex = dropIndex;
            dropIndex++;
            const reader = new FileReader();
            reader.onload = function (event) {
              const imageUrl = event.target.result;
              editor.insertEmbed(currentDropIndex, "customImage", imageUrl);
              attachImageResizer(editor);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    });
  });

  // New-Worksheet
  const newWorksheetButton = document.getElementById("new-worksheet");
  newWorksheetButton.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/worksheets-gpt/step-1";
  });

  // Add a debounce function to prevent rapid firing of events
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Images Tab.
  (function setupImageSearch() {
    const imageSearch = document.getElementById("imageSearch");
    const imageContainer = document.getElementById("imageContainer");
    let currentImageData = [];
    const PIXABAY_API_KEY = "48759124-eabd22e7e8b1c2febfc435ef1";
    const IMAGE_LIMIT = 100;

    function showLoadingSpinner() {
      imageContainer.innerHTML = `
          <div class="spinner-container fade-in flex items-center justify-center w-full h-full">
              <div class="spinner"></div>
          </div>
      `;
    }

    function fetchEducationalImages(query = "educational") {
      showLoadingSpinner();

      const searchUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
        query
      )}&image_type=photo&category=education&per_page=${IMAGE_LIMIT}`;

      const fetchStartTime = Date.now();
      const minLoadingTime = 800;

      fetch(searchUrl)
        .then((response) => {
          if (!response.ok) throw new Error(response.statusText);
          return response.json();
        })
        .then((data) => {
          const elapsed = Date.now() - fetchStartTime;
          const remainingTime = Math.max(0, minLoadingTime - elapsed);

          setTimeout(() => {
            currentImageData = data.hits;
            renderImages(currentImageData);
          }, remainingTime);
        })
        .catch((error) => {
          console.error("Error loading educational images:", error);
          imageContainer.innerHTML = `
                  <p class='text-red-500 whitespace-nowrap'>
                      Error loading images.
                  </p>
              `;
        });
    }

    function renderImages(imageData) {
      imageContainer.innerHTML = "";

      if (!imageData || imageData.length === 0) {
        imageContainer.innerHTML = `
              <p class='font-bold whitespace-nowrap'>
                  No images found.
              </p>
          `;
        return;
      }

      const fragment = document.createDocumentFragment();

      imageData.forEach((item, index) => {
        const imageUrl = item.webformatURL || item.largeImageURL;
        const wrapper = document.createElement("div");
        wrapper.className = "h-35 w-full";

        const img = document.createElement("img");
        img.src = imageUrl || "";
        img.alt = item.tags || "Educational Image";
        img.className =
          "draggable-item cursor-move w-full h-full object-cover rounded-sm opacity-0";
        img.draggable = true;
        img.setAttribute("data-type", "image");
        img.setAttribute("data-src", imageUrl);

        // Improved error handling for images
        img.addEventListener("error", function () {
          wrapper.remove(); // Remove wrapper if image fails to load
        });

        img.addEventListener("load", function () {
          setTimeout(() => {
            this.classList.add("fade-in");
            this.style.opacity = "1";
          }, 50 * (index % 10)); // Stagger effect
        });

        // Drag start handler with preview
        img.addEventListener("dragstart", function (e) {
          e.dataTransfer.setData("text/plain", imageUrl);
          e.dataTransfer.setData("item-type", "image");

          const dragImage = new Image();
          dragImage.src = imageUrl;
          document.body.appendChild(dragImage);
          dragImage.style.width = "100px";
          dragImage.style.height = "100px";
          dragImage.style.objectFit = "cover";
          dragImage.style.position = "absolute";
          dragImage.style.top = "-1000px";
          e.dataTransfer.setDragImage(dragImage, 50, 50);
          setTimeout(() => {
            document.body.removeChild(dragImage);
          }, 0);
        });

        wrapper.appendChild(img);
        fragment.appendChild(wrapper);
      });

      imageContainer.appendChild(fragment);
    }

    // Event listener for search input with debounce
    imageSearch.addEventListener(
      "input",
      debounce(function (e) {
        const query = e.target.value.trim();
        if (query.length < 2) {
          fetchEducationalImages(); // Default to educational images
          return;
        }

        showLoadingSpinner();

        const searchUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
          query
        )}&image_type=photo&per_page=${IMAGE_LIMIT}`;

        const fetchStartTime = Date.now();
        const minLoadingTime = 800;

        fetch(searchUrl)
          .then((response) => {
            if (!response.ok) throw new Error(response.statusText);
            return response.json();
          })
          .then((data) => {
            const elapsed = Date.now() - fetchStartTime;
            const remainingTime = Math.max(0, minLoadingTime - elapsed);

            setTimeout(() => {
              currentImageData = data.hits;
              renderImages(currentImageData);
            }, remainingTime);
          })
          .catch((error) => {
            console.error("Error loading images:", error);
            imageContainer.innerHTML = `
                      <p class='text-red-500 whitespace-nowrap'>
                          Error loading images.
                      </p>
                  `;
          });
      }, 500)
    );

    // Initialize with educational images when in active tab
    window.fetchTrendingImages = function () {
      fetchEducationalImages();
    };

    if (!document.getElementById("tab-images").classList.contains("hidden")) {
      fetchEducationalImages();
    }
  })();

  // Stickers Tab.
  (function setupGiphyStickers() {
    const stickerSearch = document.getElementById("stickerSearch");
    const stickerContainer = document.getElementById("stickerContainer");
    const stickerTab = document.getElementById("tab-sticker");

    const GIPHY_API_KEY = "IAxCh4Lzi7YqkLbdYFouUjEJLhlQq8Ug";
    let globalLoadedStickers = new Set();

    function showLoadingSpinner() {
      stickerContainer.innerHTML = `
      <div class="spinner-container fade-in flex items-center justify-center w-full h-full">
        <div class="spinner"></div>
      </div>
    `;
    }

    function loadStickers(query) {
      const finalQuery =
        query && query.trim().length > 0
          ? query.trim()
          : "educational learning";
      showLoadingSpinner();
      const spinnerStartTime = Date.now();
      const endpoint = `https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
        finalQuery
      )}&limit=50`;

      fetch(endpoint)
        .then((response) => {
          if (!response.ok) throw new Error("Network response failed");
          return response.json();
        })
        .then((data) => {
          // Spinner shows for at least 300ms
          const elapsed = Date.now() - spinnerStartTime;
          const minimumSpinnerTime = 300;
          const render = () => {
            globalLoadedStickers = new Set();
            renderStickers(data.data || []);
          };
          if (elapsed < minimumSpinnerTime) {
            setTimeout(render, minimumSpinnerTime - elapsed);
          } else {
            render();
          }
        })
        .catch((error) => {
          console.error("Error fetching stickers:", error);
          stickerContainer.innerHTML = `
          <p class='whitespace-nowrap text-red-500 '>
            Failed to load stickers.
          </p>
        `;
        });
    }

    function renderStickers(stickers) {
      stickerContainer.innerHTML = "";

      if (!stickers || stickers.length === 0) {
        stickerContainer.innerHTML = `
        <p class='whitespace-nowrap font-bold '>
          No stickers found.
        </p>
      `;
        return;
      }

      const displayedStickers = new Set();
      const fragment = document.createDocumentFragment();

      stickers.forEach((sticker, index) => {
        // Show the still image, if it fails, try the animated version.
        let stickerUrl =
          sticker.images.fixed_width_still?.url ||
          sticker.images.fixed_width?.url;
        const stickerId = sticker.id;
        const stickerKey = `giphy-${stickerId}`;

        if (
          displayedStickers.has(stickerKey) ||
          globalLoadedStickers.has(stickerKey)
        )
          return;

        displayedStickers.add(stickerKey);
        globalLoadedStickers.add(stickerKey);

        const wrapper = document.createElement("div");
        wrapper.className = "aspect-w-1 aspect-h-1 p-2";

        const img = document.createElement("img");
        img.src = stickerUrl;
        img.alt = sticker.title || "Sticker";
        img.className =
          "draggable-item cursor-move w-full h-full object-contain rounded-sm";
        img.style.opacity = "0";
        img.style.backgroundColor = "transparent";
        img.draggable = true;
        img.setAttribute("data-type", "image");
        img.setAttribute("data-src", stickerUrl);
        img.setAttribute("data-sticker-key", stickerKey);

        // Fallback: if the still image fails, try the animated version once.
        let fallbackTried = false;
        img.addEventListener("error", function handleError() {
          if (
            !fallbackTried &&
            sticker.images.fixed_width?.url &&
            stickerUrl === sticker.images.fixed_width_still?.url
          ) {
            fallbackTried = true;
            stickerUrl = sticker.images.fixed_width.url;
            img.src = stickerUrl;
          } else {
            // Remove the wrapper if both fail to avoid leaving a blank space.
            wrapper.remove();
            displayedStickers.delete(stickerKey);
            globalLoadedStickers.delete(stickerKey);
          }
        });

        img.addEventListener("load", function () {
          setTimeout(() => {
            this.classList.add("fade-in");
            this.style.opacity = "1";
          }, 50 * (index % 10));
        });

        // Drag event handler
        img.addEventListener("dragstart", function (e) {
          e.dataTransfer.setData("text/plain", stickerUrl);
          e.dataTransfer.setData("item-type", "image");
          e.dataTransfer.setData("sticker-key", stickerKey);
        });

        wrapper.appendChild(img);
        fragment.appendChild(wrapper);
      });

      stickerContainer.appendChild(fragment);
    }

    // Debounced search: use entered keyword or fallback to default
    stickerSearch.addEventListener(
      "input",
      debounce(function (e) {
        const query = e.target.value;
        loadStickers(query);
      }, 500)
    );

    // Expose the fetchStickers function to the global scope
    window.fetchStickers = function (type) {
      if (type === "sticker") {
        loadStickers("");
      }
    };

    // Modify tab button handlers to also call loadStickers when sticker tab is selected
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => {
      const originalClickHandler = button.onclick;
      button.onclick = function (e) {
        // If there was an original handler, call it first
        if (typeof originalClickHandler === "function") {
          originalClickHandler.call(this, e);
        }

        // If this is the sticker tab button, load stickers
        if (this.getAttribute("data-tab") === "sticker") {
          // Check if stickers are already loaded
          if (stickerContainer && stickerContainer.children.length === 0) {
            loadStickers("");
          }
        }
      };
    });

    // Check if we're already on the sticker tab at page load and load stickers if so
    if (stickerTab && !stickerTab.classList.contains("hidden")) {
      loadStickers("");
    }
  })();

  // Emoji Tab.
  (function setupEmojiSearch() {
    let emojiData = [];
    const emojiContainer = document.getElementById("emojiContainer");
    const emojiSearch = document.getElementById("emojiSearch");

    // Fetch emoji data
    window.initializeEmojis = function () {
      fetch(emojiUrl)
        .then((response) => {
          if (!response.ok) throw new Error("Network error");
          return response.json();
        })
        .then((data) => {
          emojiData = data;
          renderEmojis(emojiData.slice(0, 154));
        })
        .catch((error) => {
          console.error("Emoji Load Error:", error);
          emojiContainer.innerHTML = `
                  <p class='whitespace-nowrap text-red-500'>
                      Error loading emojis.
                  </p>
              `;
        });
    };

    // Debounce search for emojis to improve performance
    emojiSearch.addEventListener(
      "input",
      debounce(function (e) {
        const query = e.target.value.toLowerCase().trim();

        // If search is empty, show default emojis
        if (query.length === 0) {
          renderEmojis(emojiData.slice(0, 154));
          return;
        }

        // Filter emojis based on search query
        let filtered = emojiData.filter(
          (item) =>
            item.name.toLowerCase().includes(query) || item.char.includes(query)
        );

        // Render filtered emojis, limit to 154
        renderEmojis(filtered.slice(0, 154));
      }, 300)
    );

    function renderEmojis(emojis) {
      // Clear previous content
      emojiContainer.innerHTML = "";

      // Show message if no emojis found
      if (!emojis || emojis.length === 0) {
        emojiContainer.innerHTML = `
              <p class='whitespace-nowrap font-bold'>
                  No emojis found.
              </p>
          `;
        return;
      }

      // Create document fragment for performance
      const fragment = document.createDocumentFragment();

      // Render emojis with staggered fade-in effect
      emojis.forEach((item, index) => {
        const span = document.createElement("span");
        span.textContent = item.char;
        span.className = "draggable-item cursor-move text-2xl opacity-0";
        span.draggable = true;
        span.setAttribute("data-type", "emoji");
        span.setAttribute("data-src", item.char);
        span.setAttribute("data-emoji-code", item.codes || "");
        span.setAttribute("data-emoji-name", item.name || "");

        // Add drag start event
        span.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", item.char);
          e.dataTransfer.setData("item-type", "emoji");

          // Create drag feedback
          const dragFeedback = document.createElement("span");
          dragFeedback.textContent = item.char;
          dragFeedback.style.fontSize = "25px";
          dragFeedback.style.opacity = "0.8";
          document.body.appendChild(dragFeedback);
          e.dataTransfer.setDragImage(dragFeedback, 20, 20);

          // Remove drag feedback after drag
          setTimeout(() => {
            document.body.removeChild(dragFeedback);
          }, 0);
        });

        // Add tooltip
        span.title = item.name || item.char;

        // Staggered fade-in effect
        setTimeout(() => {
          span.classList.add("fade-in");
          span.style.opacity = "1";
        }, 50 * (index % 10));

        fragment.appendChild(span);
      });

      // Append all emojis at once
      emojiContainer.appendChild(fragment);
    }

    // When emojis tab is first initialized
    window.initializeEmojis = function () {
      fetch(emojiUrl)
        .then((response) => {
          if (!response.ok) throw new Error("Network error");
          return response.json();
        })
        .then((data) => {
          emojiData = data;
          renderEmojis(emojiData.slice(0, 154));
        })
        .catch((error) => {
          console.error("Emoji Load Error:", error);
          emojiContainer.innerHTML = `
                  <p class='whitespace-nowrap text-red-500 font-bold'>
                      Error loading emojis.
                  </p>
              `;
        });
    };

    // Initialize emojis if tab is currently active
    if (!document.getElementById("tab-emoji").classList.contains("hidden")) {
      window.initializeEmojis();
    }
  })();

  // Design Tab.
  (function setupDesignShapes() {
    let shapeData = [];
    const designContainer = document.getElementById("designContainer");
    const designSearch = document.getElementById("designSearch");
    const processedShapes = new Map();

    window.initializeDesignShapes = function () {
      fetch(shapesUrl)
        .then((response) => {
          if (!response.ok) throw new Error("Network error");
          return response.json();
        })
        .then((data) => {
          shapeData = data;
          renderDesignShapes(shapeData);
        })
        .catch((error) => {
          designContainer.innerHTML = `
                <p class='whitespace-nowrap text-red-500 font-bold'>
                    Error loading shapes. 
                </p>
            `;
          console.error("Design Shapes Load Error:", error);
        });
    };

    designSearch.addEventListener("input", function (e) {
      const query = e.target.value.toLowerCase();
      const filtered = query
        ? shapeData.filter((item) => item.label.toLowerCase().includes(query))
        : shapeData;
      renderDesignShapes(filtered);
    });

    function svgToDataUrl(svgString) {
      return (
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgString)))
      );
    }

    function svgToPng(svgDataUrl, callback) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const width = 150;
        const height = 150;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(this, 0, 0, width, height);

        try {
          const pngDataUrl = canvas.toDataURL("image/png");
          callback(pngDataUrl);
        } catch (e) {
          console.error("Failed to convert SVG to PNG:", e);
          callback(svgDataUrl);
        }
      };

      img.onerror = function () {
        console.error("Failed to load SVG for conversion");
        callback(svgDataUrl);
      };

      img.src = svgDataUrl;
    }

    function renderDesignShapes(shapes) {
      if (shapes.length === 0) {
        designContainer.innerHTML =
          "<p class='font-bold whitespace-nowrap'>No shapes found.</p>";
        return;
      }

      let pendingCount = shapes.length;
      const shapesToAdd = new Array(shapes.length);

      shapes.forEach((item, index) => {
        const shapeId = `shape-${item.label}-${index}`;

        if (processedShapes.has(shapeId)) {
          shapesToAdd[index] = processedShapes.get(shapeId);
          pendingCount--;

          if (pendingCount === 0) {
            updateDesignContainer(shapesToAdd);
          }
          return;
        }

        const svgUrl = svgToDataUrl(item.svg);

        svgToPng(svgUrl, (pngUrl) => {
          const wrapper = document.createElement("div");
          wrapper.className =
            "draggable-item cursor-move p-2 flex items-center justify-center h-32 w-full";

          const img = document.createElement("img");
          img.src = pngUrl;
          img.alt = item.label;
          img.className = "w-full h-full object-contain opacity-0";
          img.addEventListener("load", function () {
            setTimeout(() => {
              this.classList.add("fade-in");
              this.style.opacity = "1";
            }, 50 * (index % 10));
          });

          wrapper.appendChild(img);
          wrapper.setAttribute("data-type", "bg-shape");
          wrapper.setAttribute("data-src", pngUrl);
          wrapper.draggable = true;

          // Use span instead of div for inline behavior
          const backgroundSpanHtml = `<span 
          style="display: inline-block; position: relative; width:150px; height:150px; background-image:url('${pngUrl}'); 
          background-size:contain; background-position:center; background-repeat:no-repeat;"
          contenteditable="false" 
          class="svg-shape-background"></span>`;

          wrapper.addEventListener("dragstart", function (e) {
            // Set HTML instead of image URL
            e.dataTransfer.setData("text/html", backgroundSpanHtml);
            e.dataTransfer.setData("item-type", "bg-shape");

            // Add drag preview
            const dragImage = new Image();
            dragImage.src = pngUrl;
            document.body.appendChild(dragImage);
            dragImage.style.width = "100px";
            dragImage.style.height = "100px";
            dragImage.style.position = "absolute";
            dragImage.style.top = "-1000px";
            e.dataTransfer.setDragImage(dragImage, 50, 50);
            setTimeout(() => {
              document.body.removeChild(dragImage);
            }, 0);
          });

          processedShapes.set(shapeId, wrapper);
          shapesToAdd[index] = wrapper;
          pendingCount--;

          if (pendingCount === 0) {
            updateDesignContainer(shapesToAdd);
          }
        });
      });
    }

    function updateDesignContainer(shapeElements) {
      const spinner = designContainer.querySelector(".spinner-container");
      if (spinner) {
        spinner.classList.remove("fade-in");
        spinner.classList.add("fade-out");

        setTimeout(() => {
          designContainer.innerHTML = "";
          const fragment = document.createDocumentFragment();
          shapeElements.forEach((element) => {
            if (element) fragment.appendChild(element);
          });
          designContainer.appendChild(fragment);
        }, 300);
      } else {
        designContainer.innerHTML = "";
        const fragment = document.createDocumentFragment();
        shapeElements.forEach((element) => {
          if (element) fragment.appendChild(element);
        });
        designContainer.appendChild(fragment);
      }
    }

    if (!document.getElementById("tab-design").classList.contains("hidden")) {
      window.initializeDesignShapes();
    }
  })();

  // Upload Tab.
  (function setupUpload() {
    const uploadButton = document.getElementById("uploadButton");
    const uploadInput = document.getElementById("uploadInput");
    const uploadContainer = document.getElementById("uploadContainer");
    const uploadedImages = [];
    uploadButton.addEventListener("click", function () {
      uploadInput.click();
    });
    uploadInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const imageUrl = event.target.result;
          const existingImages = uploadedImages.map((img) => img.src);
          if (!existingImages.includes(imageUrl)) {
            uploadedImages.push({
              src: imageUrl,
              id: "upload-img-" + Date.now(),
            });
            const wrapper = document.createElement("div");
            wrapper.className =
              "draggable-item cursor-move w-full h-35 object-cover rounded-sm";
            wrapper.style.backgroundImage = `url(${imageUrl})`;
            wrapper.style.backgroundSize = "cover";
            wrapper.style.backgroundPosition = "center";
            wrapper.draggable = true;
            wrapper.setAttribute("data-type", "custom-upload");
            wrapper.setAttribute("data-src", imageUrl);
            wrapper.addEventListener("dragstart", function (e) {
              e.dataTransfer.setData("text/plain", imageUrl);
              e.dataTransfer.setData("item-type", "custom-upload");
              e.dataTransfer.effectAllowed = "copy";
              const dragImage = new Image();
              dragImage.src = imageUrl;
              document.body.appendChild(dragImage);
              dragImage.style.width = "100px";
              dragImage.style.height = "100px";
              dragImage.style.objectFit = "cover";
              dragImage.style.position = "absolute";
              dragImage.style.top = "-1000px";
              e.dataTransfer.setDragImage(dragImage, 50, 50);
              setTimeout(() => {
                document.body.removeChild(dragImage);
              }, 0);
            });
            uploadContainer.appendChild(wrapper);
            document.getElementById("uploadBg").style.display = "none";
          }
        };
        reader.readAsDataURL(file);
      }
    });
  })();
});
