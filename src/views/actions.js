export function renderActions() {
  return `
  <div class="flex gap-3 flex-wrap mb-8">
    <button data-action="save"
      class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
      Save
    </button>
    <button data-action="reset"
      class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
      Reset to Defaults
    </button>
  </div>`;
}
