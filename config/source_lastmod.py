"""
Real <lastmod> dates for the static frontend routes, read from git history.

The pages under /about, /areas, /blog and so on are Astro templates, not rows
in a table, so there is no updated_at to point at. The honest substitute is the
last commit that touched what the page is built from: its templates, its view,
and its slice of the translation file. A deploy timestamp would be the easy
alternative, but it would tell Google every page changed on every deploy, and
Google learns to ignore a lastmod that behaves that way.

Two things follow from reading git at request time:

- The answers are cached for the life of the process. `systemctl restart
  gunicorn` is already a step in every redeploy (deploy/DEPLOY.md), so the
  cache clears exactly when the history it summarizes has moved on.
- Everything degrades to "no lastmod" rather than to a wrong one. If the
  deployment has no .git directory (the rsync path in DEPLOY.md excludes it),
  no git binary, or a source file that was never committed, the sitemap simply
  omits <lastmod> for that URL, which is valid and honest.
"""

import logging
import subprocess
from datetime import datetime
from functools import lru_cache

from django.conf import settings

# Missing dates are easy to overlook — the sitemap stays valid and nothing
# errors — so every reason git failed is logged once per worker.
logger = logging.getLogger(__name__)

# The file every page's copy lives in. Its keys are page-prefixed
# (about_title, home_hero_title, ...), which is what lets a route ask for the
# history of its own text instead of the whole file's.
TRANSLATIONS = 'frontend/src/i18n/translations.js'

# git -G takes a POSIX extended regex, so no \s here.
_KEY_PATTERN = '^[[:space:]]+{prefix}_'

# Long enough that a cold page cache on the server is not mistaken for a hang,
# short enough that a wedged git can never hold a request open.
_GIT_TIMEOUT = 5


def _git_log(*args):
    """Last commit date matching `args`, or None if git can't answer."""
    try:
        result = subprocess.run(
            [
                'git',
                '-C',
                str(settings.BASE_DIR),
                # Page templates live in directories named [lang], which a
                # pathspec would otherwise be free to read as a wildcard.
                '--literal-pathspecs',
                'log',
                '-1',
                '--format=%cI',
                *args,
            ],
            capture_output=True,
            text=True,
            timeout=_GIT_TIMEOUT,
        )
    except (OSError, subprocess.SubprocessError) as error:
        # No git binary, or it died. Not worth failing a sitemap over.
        logger.warning('sitemap lastmod: git unavailable (%s)', error)
        return None
    if result.returncode != 0:
        # Not a repository, or a checkout git refuses to trust (an rsync
        # deploy drops .git; a clone owned by another user trips safe.directory).
        logger.warning('sitemap lastmod: git failed — %s', result.stderr.strip())
        return None
    stamp = result.stdout.strip()
    if not stamp:
        # git answered, but nothing in history touched these paths.
        logger.warning('sitemap lastmod: no commits for %s', args)
        return None
    return datetime.fromisoformat(stamp)


@lru_cache(maxsize=None)
def last_commit(paths, key_prefix=None):
    """
    When the page built from `paths` last changed.

    `paths` is a tuple of repo-relative files (hashable, because the result is
    cached against it). `key_prefix` names this page's translation keys, e.g.
    'about' for about_title and friends; the commits that edited those lines
    count as changes to the page even though no template moved.

    Returns an aware datetime, or None if git could not date any of it.
    """
    dates = [_git_log('--', *paths)]
    if key_prefix:
        dates.append(
            _git_log('-G', _KEY_PATTERN.format(prefix=key_prefix), '--', TRANSLATIONS)
        )
    dates = [date for date in dates if date is not None]
    return max(dates) if dates else None
