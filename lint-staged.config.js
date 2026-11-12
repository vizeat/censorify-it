export default {
  '**/*.{js,ts}': 'eslint --fix',
  '**/*.{js,ts}?(x)': () => 'yarn check-build',
}
