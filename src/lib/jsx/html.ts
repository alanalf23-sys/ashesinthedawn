export const Html = {
  empty: (el: Element) => {
    while (el.firstChild) el.removeChild(el.firstChild)
  }
};
