import React, { Component } from 'react';
import './App.scss';

const inputNode = { type: 'input' };

class RichText extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            textList: [],
            inputIdx: -1,
            composition: false,
            focus: false,
        };
        this.inputRef = null;
        this.richText = null;
        this.itemList = [];
    }

    componentDidMount() {
        this.richText.addEventListener('paste', () => false);

        const text =
            '这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试这是个测试';
        const textList = text.split('').map(item => ({
            key: Math.random(),
            type: 'text',
            text: item,
        }));
        textList.splice(2, 0, {
            key: Math.random(),
            type: 'pause',
            time: '2s',
        });
        textList.splice(5, 0, {
            key: Math.random(),
            type: 'speed',
            text: '好多倍',
            speed: 1.3,
        });
        textList.push({
            type: 'input',
        });
        this.setState({ textList });
    }

    cursorChange(idx, e) {
        e.stopPropagation();
        const { clientX, target } = e;
        const { offsetLeft, offsetWidth } = target;
        const position = clientX - offsetLeft < offsetWidth / 2 ? 0 : 1;

        let { textList, inputIdx, focus } = this.state;
        textList = textList.filter(item => item.type !== 'input');
        if (focus) textList.splice(inputIdx, 1);
        const nextInputIdx = (idx > inputIdx ? idx - 1 : idx) + position;
        textList.splice(nextInputIdx, 0, inputNode);
        this.setState({ inputIdx: nextInputIdx, textList, focus: true }, () => {
            this.inputRef.focus();
        });

        // console.error(idx, clientX, offsetLeft);
    }

    onInputKeyDown(e) {
        const { keyCode, code, target } = e;
        console.error(keyCode, code);
        let { inputIdx, textList } = this.state;
        const { left, top } = target.getBoundingClientRect();
        const itemList = this.itemList;
        switch (keyCode) {
            case 8: // 删除 backspae
                textList.splice(inputIdx - 1, 1);
                inputIdx--;
                break;
            case 46: // 删除 delete
                textList.splice(inputIdx + 1, 1);
                break;
            case 36: // home
                textList.unshift(...textList.splice(inputIdx, 1));
                inputIdx = 0;
                break;
            case 35: // end
                textList.push(...textList.splice(inputIdx, 1));
                inputIdx = textList.length - 1;
                break;

            case 37: // 左
                if (inputIdx - 1 < 0) return; // 最头部限制
                [textList[inputIdx], textList[inputIdx - 1]] = [textList[inputIdx - 1], textList[inputIdx]];
                inputIdx--;

                break;
            case 39: // 右
                if (inputIdx + 1 >= textList.length) return; // 最尾部限制
                [textList[inputIdx], textList[inputIdx + 1]] = [textList[inputIdx + 1], textList[inputIdx]];
                inputIdx++;

                break;
            case 38: // 上
                for (let i = itemList.length - 1; i >= 0; i--) {
                    const item = itemList[i];
                    if (!item) continue;
                    const { left: itemLeft, top: itemTop } = item.getBoundingClientRect();
                    if (itemTop < top && itemLeft <= left) {
                        const idx = i;
                        textList.splice(idx, 0, ...textList.splice(inputIdx, 1));
                        inputIdx = idx;
                        break;
                    }
                }
                break;

            case 40: // 下
                for (let i = 0, len = itemList.length; i < len; i++) {
                    const item = itemList[i];
                    if (!item) continue;
                    const { left: itemLeft, top: itemTop } = item.getBoundingClientRect();
                    if (itemTop > top && itemLeft > left) {
                        const idx = i - 1;
                        textList.splice(idx, 0, ...textList.splice(inputIdx, 1));
                        inputIdx = idx;
                        break;
                    }
                }
                break;
        }
        this.setState({ inputIdx, textList });
    }

    onInputChange(e) {
        // console.error('change', this.state.composition, e.target.innerText);
        const { composition, inputIdx, textList } = this.state;
        if (composition === false) {
            textList.splice(inputIdx, 0, {
                key: Math.random(),
                type: 'text',
                text: e.target.innerText,
            });
            this.setState({
                textList,
                inputIdx: inputIdx + 1,
            });
            this.inputRef.innerText = '';
        }
    }

    onInputBlur() {
        this.setState({ focus: false });
    }

    // 输入法开始
    onInputCompositionStart(e) {
        // console.error('start：', e.target.innerText);
        this.setState({ composition: true });
    }

    //输入法结束
    onInputCompositionEnd(e) {
        // console.error('end：', e.target.innerText);
        const { textList, inputIdx } = this.state;
        let valueArr = e.target.innerText.split('');
        valueArr = valueArr.map(item => ({
            key: Math.random(),
            type: 'text',
            text: item,
        }));
        textList.splice(inputIdx, 0, ...valueArr);

        this.setState({
            composition: false,
            textList,
            inputIdx: inputIdx + valueArr.length,
        });
        this.inputRef.innerText = '';
    }

    onPaste(e) {
        e.preventDefault(); // 阻止粘贴
        const { inputIdx, textList } = this.state;
        let pastedText = e.clipboardData.getData('Text');
        const pastedNode = pastedText.split('').map(item => ({
            key: Math.random(),
            type: 'text',
            text: item,
        }));
        textList.splice(inputIdx, 0, ...pastedNode);
        this.setState({ textList, inputIdx: inputIdx + pastedText.length });
    }

    render() {
        const { inputIdx, textList, composition, focus } = this.state;
        console.error(focus);
        return (
            <div className='rich-text' ref={node => (this.richText = node)}>
                {textList.map((item, idx) => {
                    const { key, type, text, time, speed } = item;
                    switch (type) {
                        case 'text':
                            return (
                                <b
                                    key={key}
                                    className='text'
                                    ref={node => (this.itemList[idx] = node)}
                                    onClick={this.cursorChange.bind(this, idx)}
                                >
                                    {text}
                                </b>
                            );
                        case 'pause':
                            return (
                                <div
                                    key={key}
                                    className='pause'
                                    ref={node => (this.itemList[idx] = node)}
                                    onClick={this.cursorChange.bind(this, idx)}
                                >
                                    {time}
                                </div>
                            );
                        case 'speed':
                            return (
                                <div
                                    key={key}
                                    className='speed'
                                    ref={node => (this.itemList[idx] = node)}
                                    onClick={this.cursorChange.bind(this, idx)}
                                >
                                    [{text}] <span className='s'>{speed}</span>
                                </div>
                            );
                        case 'input':
                            return (
                                <b key='input' className={`input-node ${composition ? 'composition' : ''}`}>
                                    <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        className='input'
                                        type='text'
                                        ref={node => (this.inputRef = node)}
                                        onKeyDown={this.onInputKeyDown.bind(this)}
                                        onInput={this.onInputChange.bind(this)}
                                        onCompositionStart={this.onInputCompositionStart.bind(this)}
                                        onCompositionEnd={this.onInputCompositionEnd.bind(this)}
                                        onPaste={this.onPaste.bind(this)}
                                        onBlur={this.onInputBlur.bind(this)}
                                    ></span>
                                </b>
                            );
                        default:
                            return null;
                    }
                })}
            </div>
        );
    }
}

export default RichText;
