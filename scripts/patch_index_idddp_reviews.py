from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "idddp-reviews.html"
GENERATED = ROOT / "scripts" / "idddp_reviews.generated.js"

START_MARKER = "  /* ---------- IDDDP / DDP Reviews ---------- */\n  var idddpReviews = ["
END_MARKER = "\n</script>"

OLD_META = """    var meta = '<div class="review-content-meta">'
      + '<strong>Review by ' + escapeHtml(review.name) + '</strong><br>'
      + 'Parent department — ' + escapeHtml(review.parentDept) + ', ' + escapeHtml(review.parentDegree)
      + ' &nbsp;|&nbsp; Host department — ' + escapeHtml(review.hostDept)
      + '</div>';"""

NEW_META = """    var programLabel = review.program === 'IDDDP' ? 'IDDDP' : 'Dual Degree (DDP)';
    var meta = '<div class="review-content-meta">'
      + '<strong>Review by ' + escapeHtml(review.name) + '</strong><br>'
      + escapeHtml(programLabel)
      + ' &nbsp;|&nbsp; Host department — ' + escapeHtml(review.hostDept)
      + '</div>';"""


def main():
    html = INDEX.read_text(encoding="utf-8")
    generated = GENERATED.read_text(encoding="utf-8").rstrip()

    start = html.index(START_MARKER)
    end = html.index(END_MARKER, start)
    html = html[:start] + "  /* ---------- IDDDP / DDP Reviews ---------- */\n" + generated + html[end:]



    INDEX.write_text(html, encoding="utf-8")
    print("Updated idddp-reviews.html with CSV review data")


if __name__ == "__main__":
    main()
