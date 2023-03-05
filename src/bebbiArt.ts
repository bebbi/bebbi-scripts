// https://patorjk.com/software/taag/#p=display&f=Big&t=bebbi
// then escape \ to \\
export const bebbiArt = `
  _          _     _     _                      _       _ 
 | |        | |   | |   (_)                    (_)     | |
 | |__   ___| |__ | |__  _   ___  ___  ___ _ __ _ _ __ | |_ ___ 
 | '_ \\ / _ \\ '_ \\| '_ \\| | /__/ / __|/ __| '__| | '_ \\| __/ __|
 | |_) |  __/ |_) | |_) | |      \\__ \\ (__| |  | | |_) | |_\\__ \\
 |_.__/ \\___|_.__/|_.__/|_|      |___/\\___|_|  |_| .__/ \\__|___/
                                                 | |
                                                 |_|
`

export const signOff = () => {
  console.log('\n', 'Thanks for using:', bebbiArt)
}
