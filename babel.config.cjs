module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }], ['@babel/preset-react', { runtime: 'automatic' }]],
  // Jest executes browser configuration against its own public test environment.
  // Vite itself consumes import.meta.env; this transform is used only by Jest.
  plugins: [function viteEnvironmentForJest({ types: t }) {
    return { visitor: { MemberExpression(path) {
      const node = path.node;
      if (t.isMetaProperty(node.object) && node.object.meta.name === 'import' && node.object.property.name === 'meta' && t.isIdentifier(node.property, { name: 'env' })) {
        path.replaceWith(t.memberExpression(t.identifier('process'), t.identifier('env')));
      }
    } } };
  }],
};
