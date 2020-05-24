from pipeline import preprocess, model_run

if __name__ == '__main__':
    r = preprocess('Nice! I\'m interested. See you then!')
    model_run(r)


    r = preprocess('I can\'t come but still want to help. Do you accept donations on credit card?')
    model_run(r)