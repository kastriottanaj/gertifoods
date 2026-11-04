// Spam trap shared by the public lead/sample forms. The field is invisible to
// real visitors (positioned off-screen, hidden from assistive tech, and out of
// the tab order) but spam bots autofill it. A filled value makes the backend save
// the submission flagged as spam and send nothing for it. The field name
// "website" looks tempting to bots.
//
// The data-* attributes keep real visitors out of the trap. Password managers
// ignore autoComplete="off" and can fill hidden fields, and each one has its own
// opt-out: 1Password, LastPass, Bitwarden, Dashlane and Proton Pass, in that order.
const HIDDEN_STYLE = {
  position: 'absolute',
  left: '-9999px',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
};

export default function Honeypot({ value, onChange }) {
  return (
    <div style={HIDDEN_STYLE} aria-hidden="true">
      <label>
        Website
        <input
          type="text"
          name="website"
          value={value}
          onChange={onChange}
          tabIndex={-1}
          autoComplete="off"
          data-1p-ignore=""
          data-lpignore="true"
          data-bwignore=""
          data-form-type="other"
          data-protonpass-ignore=""
        />
      </label>
    </div>
  );
}
