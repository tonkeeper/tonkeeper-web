const memoryStore = () => {
    let tonapiToken: string | undefined = undefined;

    return {
        getTonapiToken: () => tonapiToken,
        setTonapiToken: (token: string) => (tonapiToken = token)
    };
};

const instance = memoryStore();

export default instance;
