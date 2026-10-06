import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
let html=readFileSync('dist/index.html','utf8');
html=html.replace(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g,(_,path)=>'<script type="module">'+readFileSync('dist/'+path.replace(/^\//,''),'utf8').replaceAll('</script','<\\/script')+'</script>');
html=html.replace(/<link[^>]*href="([^"]+\.css)"[^>]*>/g,(_,path)=>'<style>'+readFileSync('dist/'+path.replace(/^\//,''),'utf8')+'</style>');
mkdirSync('docs',{recursive:true});writeFileSync('docs/index.html',html);console.log('Updated standalone GitHub Pages game.');
