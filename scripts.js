document.addEventListener("DOMContentLoaded", function() {
  var toc = document.getElementById("toc");
  if (!toc) return;
  if (toc.classList.contains("no-auto-fill")) return;
  // Select all headings except those inside the TOC div itself
  var headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
    .filter(heading => !toc.contains(heading));
  if (headings.length === 0) return;

  var ul = document.createElement("ul");
  headings.forEach(function(heading, i) {
    if (!heading.id) 
      heading.id = "section_" + heading.textContent.toLowerCase()
                        .replace(/\s+/g, "_")
                        .replace(/[^\w\-]+/g, "");
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "#" + heading.id;

    var level = parseInt(heading.tagName.substring(1));
    var indent = "\u00A0\u00A0\u00A0\u00A0".repeat(level - 1); // 4 spaces per indent level

    a.textContent = indent + heading.textContent;
    li.appendChild(a);
    ul.appendChild(li);
  });
  toc.appendChild(ul);
});



function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.style.display = (menu.style.display === "flex") ? "none" : "flex";
}
