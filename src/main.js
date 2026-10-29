import "./style.css";
import memesArr from "./memes.json";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const absoluteBasePath = new URL(basePath, window.location.origin).href;

class Winnie {
  constructor() {
    this.dom = this.getDomElements();
    this.memesCollection = memesArr.sort((a, b) =>
      a.no1.text > b.no1.text ? 1 : b.no1.text > a.no1.text ? -1 : 0,
    );

    this.memeIndex = 0;
    this.memeTotoal = this.memesCollection.length;
    this.resolution = "standard";
    this.selectedMeme = null;

    this.init();
    this.bindEvents();
  }

  /* ----------------------------- */
  /* Initialization                */
  /* ----------------------------- */

  getDomElements() {
    return {
      classicsList: document.querySelector(".classics-list"),
      download: document.querySelector(".download"),
      goHome: document.querySelector("#go-home"),
      hrefDownload: document.querySelector(".href-download"),
      meme: document.querySelector(".meme"),
      memesTotal: document.querySelector(".memes-total"),
      random: document.querySelector(".random"),
      resolutionRadios: document.querySelectorAll('input[name="resolution"]'),
      source: document.querySelector(".source"),
      suggestions: document.querySelector(".suggestions"),
      text1: document.querySelector(".text.no1"),
      text2: document.querySelector(".text.no2"),
      url: document.querySelector(".url"),
    };
  }

  init() {
    const hashResolution = window.location.hash.substring(1);
    const slug = window.location.pathname.replace(/\/$/, "").split("/").pop();
    this.renderClassicsList();
    this.dom.memesTotal.textContent = this.memeTotoal;

    const foundIndex = this.memesCollection.findIndex(
      (obj) => obj.slug === slug,
    );
    this.memeIndex = foundIndex;
    this.selectedMeme = this.memesCollection[this.memeIndex] ?? null;

    this.setPageMode(foundIndex !== -1);

    this.changeResolution(hashResolution || "standard", true);
    this.updateMeme(this.selectedMeme);
  }

  renderClassicsList() {
    const list = document.createDocumentFragment();

    this.memesCollection.forEach((meme) => {
      const item = document.createElement("li");
      const link = document.createElement("a");

      link.href = `${basePath}/${meme.slug}/`;
      link.dataset.slug = meme.slug;
      link.textContent = meme.no1.text || "Mème sans texte";
      item.append(link);
      list.append(item);
    });

    this.dom.classicsList.replaceChildren(list);
  }

  setPageMode(hasSelectedMeme) {
    document.documentElement.classList.toggle("is-meme", hasSelectedMeme);
    document.documentElement.classList.toggle("is-home", !hasSelectedMeme);
  }

  bindEvents() {
    this.dom.resolutionRadios.forEach((radio) => {
      radio.addEventListener("change", (e) =>
        this.changeResolution(e.target.value),
      );
    });

    this.dom.classicsList?.addEventListener("click", (event) => {
      const link = event.target.closest("a[data-slug]");
      if (!link || !this.dom.classicsList.contains(link)) return;

      event.preventDefault();
      const index = this.memesCollection.findIndex(
        (meme) => meme.slug === link.dataset.slug,
      );
      if (index !== -1) this.selectMeme(index);
    });

    this.dom.goHome?.addEventListener("click", (event) => this.goHome(event));
    this.dom.random?.addEventListener("click", () => this.getNextMeme());
    this.dom.download?.addEventListener("click", () => this.downloadMeme());
  }

  /* ----------------------------- */
  /* Meme Logic                    */
  /* ----------------------------- */

  shuffleMemes() {
    for (let i = this.memesCollection.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.memesCollection[i], this.memesCollection[j]] = [
        this.memesCollection[j],
        this.memesCollection[i],
      ];
    }
  }

  getNextMeme() {
    this.memeIndex = (this.memeIndex + 1) % this.memesCollection.length;

    if (this.memeIndex === 0) {
      this.shuffleMemes();
    }

    this.selectMeme(this.memeIndex);
  }

  goHome(event) {
    event.preventDefault();
    this.setPageMode(false);
    this.selectedMeme = null;
    this.updateMeme(null);
    this.editMeme();
  }

  selectMeme(index) {
    this.memeIndex = index;
    this.selectedMeme = this.memesCollection[index];
    this.setPageMode(true);
    this.updateMeme(this.selectedMeme);
  }

  editMeme() {
    this.dom.text1.textContent = "Écrire ici";
    this.dom.text2.textContent = "Écrire icitte";
    this.dom.text2.style.backgroundImage = "none";

    this.updateURL();
  }

  updateMeme(obj) {
    if (!obj) return;

    this.updateTextBlock(this.dom.text1, obj.no1);
    this.updateTextBlock(this.dom.text2, obj.no2);

    if (obj.source && obj.source.trim() !== "") {
      this.dom.source.style.display = "flex";
      this.dom.url.textContent = obj.source;
      this.dom.url.href = obj.source;
    } else {
      this.dom.source.style.display = "none";
    }

    this.updateURL();
  }

  updateTextBlock(element, data) {
    if (!element || !data) return;

    if (data.img) {
      element.textContent = "";
      const imageUrl = new URL(
        `${absoluteBasePath}img/memes/${data.img}`,
        `${window.location.origin}/`,
      );
      element.style.backgroundImage = `url("${imageUrl.href}")`;
    } else {
      element.textContent = data?.text ?? "";
      element.style.backgroundImage = "none";
    }
  }

  /* ----------------------------- */
  /* Resolution & URL              */
  /* ----------------------------- */

  changeResolution(resolution = "standard", updateRadio = false) {
    this.dom.meme.classList.remove("is-standard", "is-hd", "is-4k");
    this.dom.meme.classList.add(`is-${resolution}`);

    this.resolution = resolution;

    if (updateRadio) {
      const radio = document.querySelector(`input[value="${resolution}"]`);
      if (radio) radio.checked = true;
    }

    this.updateURL();
  }

  updateURL() {
    const url = this.selectedMeme?.slug
      ? `${absoluteBasePath}${this.selectedMeme.slug}/#${this.resolution}`
      : `${absoluteBasePath}#${this.resolution}`;

    const title = this.selectedMeme?.slug
      ? `Winnie le caca - ${this.selectedMeme.no1.text}`
      : "Winnie le caca";

    window.history.replaceState({}, title, url);
    document.title = title;
  }

  /* ----------------------------- */
  /* Download                      */
  /* ----------------------------- */
  async downloadMeme() {
    if (!this.dom.meme) return;

    const canvas = await html2canvas(this.dom.meme, {
      scale: window.devicePixelRatio,
      scrollX: 0,
      scrollY: 0,
    });

    const image = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    this.dom.hrefDownload.href = image;
    this.dom.hrefDownload.download = this.selectedMeme?.slug
      ? `winnie-le-caca-${this.selectedMeme?.slug}.png`
      : "winnie-le-caca.png";
    this.dom.hrefDownload.click();
  }
}

new Winnie();
