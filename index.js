// @flow

import React, { Component, PropTypes } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import _ from 'lodash';

const { width } = Dimensions.get('window');

type Props = {
  /**
   * A handler to be called when array of tags change
   */
    onChange: (items: Array<any> ) => void,
  /**
   * An array of tags
   */
    value: Array<any>,
  /**
   * A RegExp to test tags after enter, space, or a comma is pressed
   */
    regex?: Object,
  /**
   * Background color of tags
   */
    tagColor?: string,
  /**
   * Text color of tags
   */
    tagTextColor?: string,
  /**
   * Color of text input
   */
    inputColor?: string,
  /**
   * TextInput props Text.propTypes
   */
    inputProps?: Object,
  /**
   * path of the label in tags objects
   */
    labelKey?: string,
  /**
   *  maximum number of lines of this component
   */
    numberOfLines: number,
};

type State = {
  text: string,
  lines: number,
};

type NativeEvent = {
  target: number,
  key: string,
  eventCount: number,
  text: string,
};

type Event = {
  nativeEvent: NativeEvent,
};

const DEFAULT_SEPARATORS = [',', ' ', ';', '\n'];
const DEFAULT_TAG_REGEX = /(.+)/gi

class TagInput extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.array.isRequired,
    regex: PropTypes.object,
    tagColor: PropTypes.string,
    tagTextColor: PropTypes.string,
    inputColor: PropTypes.string,
    inputProps: PropTypes.object,
    labelKey: PropTypes.string,
    numberOfLines: PropTypes.number,
  };

  props: Props;
  state: State = {
    text: '',
    lines: 1,
  };

  wrapperWidth = width;

  contentHeight: 0;

  static defaultProps = {
    tagColor: '#dddddd',
    tagTextColor: '#777777',
    inputColor: '#777777',
    numberOfLines: 2,
  };

  measureWrapper = () => {
    if (!this.refs.wrapper)
      return;

    this.refs.wrapper.measure((ox, oy, w, /*h, px, py*/) => {
      this.wrapperWidth = w;
    });
  };

  calculateWidth = () => {
    setTimeout(() => {
      if (!this.refs['tag' + (this.props.value.length - 1)])
        return;

      this.refs['tag' + (this.props.value.length - 1)].measure((ox, oy, w, /*h, px, py*/) => {
        const endPosOfTag = w + ox;
        const margin = 3;
        const spaceLeft = this.wrapperWidth - endPosOfTag - margin;

        if (spaceLeft > 100) {
          return;
        }

        if (this.state.lines < this.props.numberOfLines) {
          const lines = this.state.lines + 1;

          this.setState({ lines });
        } else {
          this.scrollToBottom();
        }
      });
    }, 0);
  };

  componentDidMount() {
    setTimeout(() => {
      this.calculateWidth();
    }, 100);
  }

  componentDidUpdate(prevProps: Props, /*prevState*/) {
    if (prevProps.value.length != this.props.value.length || !prevProps.value) {
      this.calculateWidth();
    }
  }

  onBlur = (event: Event) => {
    if (!event || !event.nativeEvent || !this.props.parseOnBlur)
      return;

    const text = event.nativeEvent.text;
    this.setState({ text: text });
    this.parseTags(text);
  };

  onChange = (event: Event) => {
    if (!event || !event.nativeEvent)
      return;

    const text = event.nativeEvent.text;
    this.setState({ text: text });
    const lastTyped = text.charAt(text.length - 1);

    const parseWhen = this.props.separators || DEFAULT_SEPARATORS;
    if (parseWhen.indexOf(lastTyped) > -1)
      this.parseTags(text.slice(0, -1));
  };

  parseTags = (text) => {
    if (!text) {
      text = this.state.text;
    }

    const { value } = this.props;
    const regex = this.props.regex || DEFAULT_TAG_REGEX;
    console.log(text)
    const results = text.match(regex);

    if (results && results.length > 0) {
      this.setState({ text: '' });
      this.props.onChange(value.concat(results));
    }
  };

  onKeyPress = (event: Event) => {
    if (this.state.text === '' && event.nativeEvent && event.nativeEvent.key == 'Backspace') {
      this.pop();
    }
  };

  focus = () => {
    if (this.refs.tagInput)
      this.refs.tagInput.focus();
  };

  pop = () => {
    const tags = _.clone(this.props.value);
    tags.pop();
    this.props.onChange(tags);
    this.focus();
  };

  removeIndex = (index: number) => {
    const tags = _.clone(this.props.value);
    tags.splice(index, 1);
    this.props.onChange(tags);
    this.focus();
  };

  _getLabelValue = (tag) => {
    const { labelKey } = this.props;

    if (labelKey) {
      if (labelKey in tag) {
        return tag[labelKey];
      }
    }

    return tag;
  };

  scrollToBottom = (animated: boolean = true) => {
    if (this.contentHeight > this.state.scrollViewHeight) {
      this.refs.scrollView.scrollTo({
        y: this.contentHeight - this.state.scrollViewHeight,
        animated,
      });
    }
  };

  _renderTag = (tag, index) => {
    const { tagColor, tagTextColor } = this.props;

    return (
      <TouchableOpacity
        key={index}
        ref={'tag' + index}
        style={[styles.tag, { backgroundColor: tagColor }, this.props.tagContainerStyle]}
        onPress={() => this.removeIndex(index)}>
        <Text style={[styles.tagText, { color: tagTextColor }, this.props.tagTextStyle]}>
          {this._getLabelValue(tag)}&nbsp;&times;
        </Text>
      </TouchableOpacity>
    );
  };

  _renderInput = () => {
    const { text } = this.state;
    const { inputColor } = this.props;

    const defaultInputProps = {
      autoCapitalize: 'none',
      autoCorrect: false,
      placeholder: 'Start typing',
      returnKeyType: 'done',
      keyboardType: 'default',
      underlineColorAndroid: 'rgba(0,0,0,0)',
      ref: "tagInput",
      blurOnSubmit: false,
      onKeyPress: this.onKeyPress,
      value: text,
      style: [styles.textInput, {
        width: 185,
        color: inputColor,
      }],
      onChange: this.onChange,
      onBlur: this.onBlur,
    };

    const inputProps = { ...defaultInputProps, ...this.props.inputProps };

    if (this.props.inputRenderer) {
      return this.props.inputRenderer(inputProps);
    }

    return (
      <TextInput {...inputProps} />
    );
  };

  render() {
    const { lines } = this.state;
    const { value } = this.props;
    const maxScrollViewHeight = this.props.numberOfLines * 40

    return (
      <TouchableWithoutFeedback
        onPress={() => this.refs.tagInput ? this.refs.tagInput.focus() : null}
        onLayout={this.measureWrapper}
        style={[styles.container]}>
        <View
          style={[styles.wrapper]}
          ref="wrapper"
          onLayout={this.measureWrapper}>
          <View style={styles.textInputContainer}>
            {this._renderInput()}
          </View>
          <ScrollView
            ref='scrollView'
            style={[styles.tagInputContainerScroll, {height: this.state.scrollViewHeight}]}
            onContentSizeChange={(width, height) => {
              this.contentHeight = height
              this.setState({scrollViewHeight: Math.min(height, maxScrollViewHeight)})
              if (height > maxScrollViewHeight) {
                this.scrollToBottom()
              }
            }}
          >
            <View style={styles.tagInputContainer}>
              {value.map((tag, index) => this._renderTag(tag, index))}
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 5,
  },
  wrapper: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 3,
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  tagInputContainerScroll: {
    flex: 1,
    width: 300
  },
  tagInputContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  textInput: {
    height: 36,
    fontSize: 16,
    flex: .6,
    marginBottom: 6,
    padding: 0,
  },
  textInputContainer: {
    flex: 1,
    width: 300
  },
  tag: {
    justifyContent: 'center',
    marginTop: 6,
    marginRight: 3,
    padding: 8,
    height: 24,
    borderRadius: 2,
  },
  tagText: {
    padding: 0,
    margin: 0,
  },
});

export default TagInput;

export { DEFAULT_SEPARATORS, DEFAULT_TAG_REGEX };
