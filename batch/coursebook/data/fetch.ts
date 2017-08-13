import * as cp from "child_process";

/**
 * fetch.rb를 child process로 실행
 * @param year 
 * @param semester 
 */
export function fetchSugangSnu(year:number, semester:string):Promise<void> {
    return new Promise<void>(function(resolve, reject) {
      let child = cp.spawn('ruby', ['fetch.rb', year.toString(), semester], {
        cwd: __dirname
      });
  
      child.stdout.on('data', (data) => {
        process.stdout.write(`${data}`);
      });
  
      child.stderr.on('data', (data) => {
        process.stderr.write(`${data}`);
      });
  
      child.on('close', (code) => {
        if (code !== 0) {
          return reject(`Child process exit with ${code}`);
        }
        resolve();
      });
    })
  }
  