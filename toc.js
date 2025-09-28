document.addEventListener("DOMContentLoaded", function() {
  var toc = document.getElementById("toc");
  if (!toc) return;
  var headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  if (!headings.length) return;

  var ul = document.createElement("ul");
  headings.forEach(function(heading, i) {
    if (!heading.id) heading.id = "toc_" + i;
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "#" + heading.id;
    a.textContent = heading.textContent;
    li.appendChild(a);
    ul.appendChild(li);
  });
  toc.appendChild(ul);
});
